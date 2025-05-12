import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const VideoChat = () => {
  const [roomId, setRoomId] = useState('');
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  
  const socketRef = useRef();
  const localVideoRef = useRef(null);
  const peerConnections = useRef({});
  
  // Initialize and connect to socket server
  useEffect(() => {
    // Change the URL to match your server
    socketRef.current = io('http://localhost:3000');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      setIsConnected(true);
    });
    
    return () => {
      // Clean up - close connections and stop media
      socketRef.current.disconnect();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, []);
  
  useEffect(() => {
    if (!socketRef.current) return;
    
    socketRef.current.on('all-users', (users) => {
      console.log('All users in room:', users);
      // Create peer connections to all existing users
      users.forEach(userId => createPeerConnection(userId, true));
    });
    
    socketRef.current.on('user-joined', (userId) => {
      console.log('User joined:', userId);
      // Create peer connection for the new user
      createPeerConnection(userId, false);
    });
    
    socketRef.current.on('user-disconnected', (userId) => {
      console.log('User disconnected:', userId);
      // Clean up peer connection
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      
      // Remove from state
      setPeers(prevPeers => {
        const newPeers = { ...prevPeers };
        delete newPeers[userId];
        return newPeers;
      });
    });
    
    socketRef.current.on('offer', async ({ sdp, caller }) => {
      console.log('Received offer from', caller);
      const pc = peerConnections.current[caller];
      if (!pc) {
        console.error('No peer connection for caller:', caller);
        // Create peer connection if it doesn't exist
        const newPc = await createPeerConnection(caller, false);
        try {
          await newPc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await newPc.createAnswer();
          await newPc.setLocalDescription(answer);
          
          console.log('Sending answer to', caller);
          socketRef.current.emit('answer', {
            target: caller,
            sdp: newPc.localDescription,
            roomId
          });
        } catch (error) {
          console.error('Error handling offer with new connection:', error);
        }
        return;
      }
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        console.log('Sending answer to', caller);
        socketRef.current.emit('answer', {
          target: caller,
          sdp: pc.localDescription,
          roomId
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });
    
    socketRef.current.on('answer', async ({ sdp, answerer }) => {
      console.log('Received answer from', answerer);
      const pc = peerConnections.current[answerer];
      if (!pc) {
        console.error('No peer connection for answerer:', answerer);
        return;
      }
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log('Successfully set remote description from answer');
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });
    
    socketRef.current.on('ice-candidate', async ({ candidate, sender }) => {
      console.log('Received ICE candidate from', sender);
      const pc = peerConnections.current[sender];
      if (!pc) {
        console.error('No peer connection for sender:', sender);
        // Store the candidate for later use
        return;
      }
      
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Successfully added ICE candidate');
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });
    
    return () => {
      socketRef.current.off('all-users');
      socketRef.current.off('user-joined');
      socketRef.current.off('user-disconnected');
      socketRef.current.off('offer');
      socketRef.current.off('answer');
      socketRef.current.off('ice-candidate');
    };
  }, [roomId]);
  
  // Handle room joining
  const joinRoom = async () => {
    if (!roomId || !socketRef.current || !isConnected) return;
    
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Set local video stream
      setLocalStream(stream);
      
      // Apply the stream to the video element after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          
          // Ensure video plays
          localVideoRef.current.play().catch(e => {
            console.warn('Error auto-playing video:', e);
          });
        } else {
          console.warn('Local video ref not available');
        }
      }, 100);
      
      // Join the room
      socketRef.current.emit('join-room', roomId);
      setIsJoined(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };
  
  // Create a new WebRTC peer connection
  const createPeerConnection = async (userId, isInitiator) => {
    console.log(`Creating ${isInitiator ? 'initiator' : 'receiver'} peer connection for ${userId}`);
    
    // Check if connection already exists
    if (peerConnections.current[userId]) {
      console.log(`Connection to ${userId} already exists, skipping creation`);
      return peerConnections.current[userId];
    }
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { 
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        }
      ],
      iceCandidatePoolSize: 10
    });
    
    // Store the connection
    peerConnections.current[userId] = pc;
    
    // Add local tracks to the connection
    if (localStream) {
      console.log(`Adding ${localStream.getTracks().length} local tracks to peer connection for ${userId}`);
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    } else {
      console.warn('No local stream available when creating peer connection');
      // Try to get media again if needed
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(e => console.warn('Error playing video:', e));
        }
        
        console.log(`Adding ${stream.getTracks().length} newly acquired tracks to peer connection for ${userId}`);
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      } catch (err) {
        console.error('Failed to get media for peer connection:', err);
      }
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${userId}:`, event.candidate.candidate.substring(0, 50) + '...');
        socketRef.current.emit('ice-candidate', {
          target: userId,
          candidate: event.candidate,
          roomId
        });
      } else {
        console.log(`ICE candidate gathering completed for ${userId}`);
      }
    };
    
    // Log ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${userId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log(`✅ Connection established with ${userId}`);
      }
      if (pc.iceConnectionState === 'failed') {
        console.error(`❌ Connection failed with ${userId}`);
        // Try restarting ICE
        try {
          if (isInitiator) {
            pc.restartIce();
            pc.createOffer({ iceRestart: true })
              .then(offer => pc.setLocalDescription(offer))
              .then(() => {
                socketRef.current.emit('offer', {
                  target: userId,
                  sdp: pc.localDescription,
                  roomId
                });
              });
          }
        } catch (err) {
          console.error('Error restarting ICE:', err);
        }
      }
    };
    
    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log(`Signaling state with ${userId}:`, pc.signalingState);
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, pc.connectionState);
    };
    
    // Add negotiation needed handler
    pc.onnegotiationneeded = async () => {
      console.log(`Negotiation needed for ${userId}`);
      
      if (isInitiator) {
        try {
          console.log(`Creating new offer for ${userId} after negotiation needed`);
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await pc.setLocalDescription(offer);
          
          socketRef.current.emit('offer', {
            target: userId,
            sdp: pc.localDescription,
            roomId
          });
        } catch (err) {
          console.error('Error handling negotiation needed:', err);
        }
      }
    };
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log(`Received ${event.streams.length} streams and ${event.track.kind} track from ${userId}`);
      
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log(`Stream ID: ${stream.id}, Track ID: ${event.track.id}`);
        console.log(`Stream has ${stream.getTracks().length} tracks (${stream.getVideoTracks().length} video, ${stream.getAudioTracks().length} audio)`);
        
        setPeers(prevPeers => {
          // Check if we already have this stream
          if (prevPeers[userId] && prevPeers[userId].id === stream.id) {
            console.log(`Already have stream ${stream.id} for user ${userId}`);
            return prevPeers;
          }
          
          console.log(`Adding stream ${stream.id} for user ${userId} to peers state`);
          return {
            ...prevPeers,
            [userId]: stream
          };
        });
      } else {
        console.warn(`Received track without stream from ${userId}`);
      }
    };
    
    // If initiator, create and send an offer
    if (isInitiator && localStream) {
      try {
        console.log(`Creating initial offer for ${userId}`);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        
        console.log(`Sending initial offer to ${userId}`);
        socketRef.current.emit('offer', {
          target: userId,
          sdp: pc.localDescription,
          roomId
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
    
    return pc;
  };

  // Debug information
  const debugInfo = () => {
    return (
      <div className="mt-4 p-2 border border-gray-300 rounded bg-gray-50 text-xs text-left w-full">
        <h3 className="font-semibold">Debug Info:</h3>
        <div>Local stream: {localStream ? 'Active' : 'Not active'}</div>
        <div>Local video tracks: {localStream?.getVideoTracks().length || 0}</div>
        <div>Local audio tracks: {localStream?.getAudioTracks().length || 0}</div>
        <div>Peer connections: {Object.keys(peerConnections.current).length}</div>
        <div>Remote streams: {Object.keys(peers).length}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebRTC Video Chat</h1>
      
      {!isJoined ? (
        <div className="w-full max-w-md mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="flex-1 p-2 border rounded"
              disabled={!isConnected}
            />
            <button
              onClick={joinRoom}
              disabled={!roomId || !isConnected}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              Join Room
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Status: {isConnected ? 'Connected to server' : 'Connecting...'}
          </p>
        </div>
      ) : (
        <div className="w-full">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Room: {roomId}</h2>
            <p className="text-sm text-gray-600">Connected users: {Object.keys(peers).length + 1}</p>
            <button 
              onClick={() => {
                if (localVideoRef.current && localStream) {
                  localVideoRef.current.srcObject = localStream;
                  localVideoRef.current.play().catch(e => console.warn('Error playing local video:', e));
                }
              }}
              className="bg-green-500 text-white px-3 py-1 text-sm rounded mt-2"
            >
              Restart Local Video
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Local video */}
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 bg-black object-cover rounded"
              />
              <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 text-sm rounded">
                You
              </span>
            </div>
            
            {/* Remote videos */}
            {Object.entries(peers).length > 0 ? (
              Object.entries(peers).map(([userId, stream]) => (
                <div key={userId} className="relative">
                  <Video stream={stream} />
                  <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 text-sm rounded">
                    User {userId.slice(0, 5)}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-2 flex items-center justify-center p-8 bg-gray-100 rounded">
                <p className="text-gray-500">Waiting for other users to join...</p>
              </div>
            )}
          </div>
          
          {debugInfo()}
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Connection Actions</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  // Force renegotiation of all connections
                  Object.entries(peerConnections.current).forEach(async ([userId, pc]) => {
                    try {
                      const offer = await pc.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                        iceRestart: true
                      });
                      await pc.setLocalDescription(offer);
                      
                      socketRef.current.emit('offer', {
                        target: userId,
                        sdp: pc.localDescription,
                        roomId
                      });
                      console.log(`Sent renegotiation offer to ${userId}`);
                    } catch (err) {
                      console.error(`Failed to renegotiate with ${userId}:`, err);
                    }
                  });
                }}
                className="bg-blue-500 text-white px-3 py-1 text-sm rounded"
              >
                Renegotiate Connections
              </button>
              
              <button 
                onClick={async () => {
                  // Restart media access
                  try {
                    // Stop all existing tracks
                    if (localStream) {
                      localStream.getTracks().forEach(track => track.stop());
                    }
                    
                    // Get new media
                    const newStream = await navigator.mediaDevices.getUserMedia({ 
                      video: true, 
                      audio: true 
                    });
                    
                    // Update local video
                    setLocalStream(newStream);
                    if (localVideoRef.current) {
                      localVideoRef.current.srcObject = newStream;
                      localVideoRef.current.play().catch(e => console.warn('Error playing video:', e));
                    }
                    
                    // Replace tracks in all peer connections
                    Object.values(peerConnections.current).forEach(pc => {
                      const senders = pc.getSenders();
                      newStream.getTracks().forEach(track => {
                        const sender = senders.find(s => s.track && s.track.kind === track.kind);
                        if (sender) {
                          sender.replaceTrack(track);
                        } else {
                          pc.addTrack(track, newStream);
                        }
                      });
                    });
                    
                    console.log('Media restarted and tracks replaced');
                  } catch (err) {
                    console.error('Failed to restart media:', err);
                  }
                }}
                className="bg-green-500 text-white px-3 py-1 text-sm rounded"
              >
                Restart Media
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to render remote videos
const Video = ({ stream }) => {
  const videoRef = useRef();
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Force play the video
      videoRef.current.play().catch(e => {
        console.warn('Error auto-playing remote video:', e);
      });
      
      console.log('Set remote stream to video element:', stream.id);
    }
  }, [stream]);
  
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-64 bg-black object-cover rounded"
    />
  );
};

export default VideoChat;