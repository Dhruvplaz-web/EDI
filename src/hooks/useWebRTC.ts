import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, doc, setDoc, onSnapshot, updateDoc, addDoc } from 'firebase/firestore';

const turnServerUrl = process.env.NEXT_PUBLIC_TURN_SERVER_URL || 'relay.metered.ca:443';
const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME || 'open-source-telehealth';
const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || 'telehealth-secret';

const iceServersConfig: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    {
      urls: [
        `turn:${turnServerUrl}?transport=udp`,
        `turn:${turnServerUrl}?transport=tcp`,
        `turns:${turnServerUrl}?transport=tcp`
      ],
      username: turnUsername,
      credential: turnCredential
    }
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

  useEffect(() => {
    if (!callId) return;

    let unsubCallDoc: (() => void) | undefined;
    let unsubCandidates: (() => void) | undefined;

    const init = async () => {
      try {
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
          console.warn("WebRTC requires secure context (HTTPS) for hardware media access.");
        }

        pc.current = new RTCPeerConnection(iceServersConfig);

        pc.current.onconnectionstatechange = () => {
          if (pc.current) {
            setConnectionState(pc.current.connectionState);
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        }).catch(err => {
          console.warn("UserMedia access fallback:", err.message);
          return null;
        });

        if (stream) {
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
      localStream?.getTracks().forEach(t => t.stop());
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