import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, doc, setDoc, onSnapshot, updateDoc, addDoc } from 'firebase/firestore';

const defaultIceServersConfig: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(callId: string | undefined, role: 'clinician' | 'patient') {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!callId) return;

    let unsubCallDoc: (() => void) | undefined;
    let unsubCandidates: (() => void) | undefined;

    const init = async () => {
      try {
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
          console.warn("WebRTC requires secure context (HTTPS) for hardware media access.");
        }

        let activeIceConfig = defaultIceServersConfig;
        try {
          const iceRes = await fetch('/api/webrtc/ice');
          if (iceRes.ok) {
            const iceData = await iceRes.json();
            if (iceData?.iceServers) {
              activeIceConfig = {
                iceServers: iceData.iceServers,
                iceCandidatePoolSize: iceData.iceCandidatePoolSize || 10,
              };
            }
          }
        } catch (iceErr) {
          console.warn('ICE server fetch failed, falling back to default STUN:', iceErr);
        }

        pc.current = new RTCPeerConnection(activeIceConfig);

        pc.current.onconnectionstatechange = () => {
          if (pc.current) {
            setConnectionState(pc.current.connectionState);
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: {
            echoCancellation: true,
            autoGainControl: false, // Preserves vocal amplitude perturbation (shimmer)
            noiseSuppression: false, // Preserves vocal glottal cycles & micro-tremor (jitter)
            channelCount: 1,
            sampleRate: { ideal: 48000 }
          }
        }).catch(err => {
          console.warn("UserMedia access fallback:", err.message);
          return null;
        });

        if (stream) {
          localStreamRef.current = stream;
          setLocalStream(stream);
          const rStream = new MediaStream();
          setRemoteStream(rStream);

          stream.getTracks().forEach((track) => {
            pc.current?.addTrack(track, stream);
          });

          pc.current.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
              rStream.addTrack(track);
            });
          };
        }

        const callDoc = doc(db, 'calls', callId);
        const offerCandidates = collection(callDoc, 'offerCandidates');
        const answerCandidates = collection(callDoc, 'answerCandidates');

        pc.current.onicecandidate = (event) => {
          if (event.candidate) {
            const targetCollection = role === 'clinician' ? offerCandidates : answerCandidates;
            addDoc(targetCollection, event.candidate.toJSON()).catch(err => {
              console.warn("Firestore ICE write fallback:", err.message);
            });
          }
        };

        if (role === 'clinician') {
          const offerDescription = await pc.current.createOffer();
          await pc.current.setLocalDescription(offerDescription);

          await setDoc(callDoc, { offer: { sdp: offerDescription.sdp, type: offerDescription.type } }).catch(err => {
            console.warn("Firestore offer write fallback:", err.message);
          });

          unsubCallDoc = onSnapshot(
            callDoc,
            (snapshot) => {
              const data = snapshot.data();
              if (!pc.current?.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.current?.setRemoteDescription(answerDescription);
              }
            },
            (error) => {
              console.warn("Firestore signaling read error suppressed:", error.message);
            }
          );

          unsubCandidates = onSnapshot(
            answerCandidates,
            (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                  const data = change.doc.data();
                  if (data && data.candidate) {
                    pc.current?.addIceCandidate(new RTCIceCandidate(data));
                  }
                }
              });
            },
            (error) => {
              console.warn("Firestore ICE read error suppressed:", error.message);
            }
          );

        } else if (role === 'patient') {
          unsubCallDoc = onSnapshot(
            callDoc,
            async (snapshot) => {
              const data = snapshot.data();
              if (data?.offer && !pc.current?.currentRemoteDescription) {
                const offerDescription = new RTCSessionDescription(data.offer);
                await pc.current?.setRemoteDescription(offerDescription);

                const answerDescription = await pc.current?.createAnswer();
                await pc.current?.setLocalDescription(answerDescription);

                await updateDoc(callDoc, { answer: { type: answerDescription?.type, sdp: answerDescription?.sdp } }).catch(err => {
                  console.warn("Firestore answer update fallback:", err.message);
                });
              }
            },
            (error) => {
              console.warn("Firestore signaling read error suppressed:", error.message);
            }
          );

          unsubCandidates = onSnapshot(
            offerCandidates,
            (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                  const data = change.doc.data();
                  if (data && data.candidate) {
                    pc.current?.addIceCandidate(new RTCIceCandidate(data));
                  }
                }
              });
            },
            (error) => {
              console.warn("Firestore ICE read error suppressed:", error.message);
            }
          );
        }
      } catch (err) {
        console.warn("WebRTC Peer Connection initialization error handled:", err);
      }
    };

    init();

    return () => {
      if (unsubCallDoc) unsubCallDoc();
      if (unsubCandidates) unsubCandidates();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pc.current?.close();
    };
  }, [callId, role]);

  const toggleVideo = (enabled?: boolean) => {
    if (localStream) {
      const newState = enabled !== undefined ? enabled : !isVideoOff;
      localStream.getVideoTracks().forEach(t => t.enabled = newState);
      setIsVideoOff(!newState);
    }
  };

  const toggleAudio = (enabled?: boolean) => {
    if (localStream) {
      const newState = enabled !== undefined ? enabled : !isMuted;
      localStream.getAudioTracks().forEach(t => t.enabled = newState);
      setIsMuted(!newState);
    }
  };

  return { localStream, remoteStream, connectionState, isMuted, isVideoOff, toggleVideo, toggleAudio };
}