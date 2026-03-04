import React, { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, StopCircle } from 'lucide-react';
import { transcribeAudio } from '../lib/api';

const AudioRecorder = ({ onTranscriptionComplete, mode = 'manual', isAiSpeaking = false }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const isAiSpeakingRef = useRef(isAiSpeaking);

    // Keep ref updated
    useEffect(() => {
        isAiSpeakingRef.current = isAiSpeaking;
        // If AI stops speaking and we are in auto mode, start listening again
        if (!isAiSpeaking && mode === 'auto' && !isRecording && !isProcessing) {
            const timeout = setTimeout(() => {
                startRecording();
            }, 2000); // Wait 2s before listening again
            return () => clearTimeout(timeout);
        }
    }, [isAiSpeaking, mode, isRecording, isProcessing]);

    // Cleanup
    useEffect(() => {
        return () => {
            stopRecordingContext();
        };
    }, []);

    // Stop recording and cleanup audio context
    const stopRecordingContext = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsRecording(false);
    };

    const startRecording = async () => {
        if (isRecording || isProcessing) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup MediaRecorder
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                // If we stopped but didn't actually record valid speech (too short), ignore
                // But for now let's just process everything
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                setIsProcessing(true);
                try {
                    const result = await transcribeAudio(blob);
                    if (result && result.text) {
                        // Check for exit command
                        const lowerText = result.text.toLowerCase();
                        if (mode === 'auto' && (
                            lowerText.includes("0") ||
                            lowerText.includes("zero") ||
                            lowerText.includes("end") ||
                            lowerText.includes("turn off") ||
                            lowerText.includes("voice mode")
                        )) {
                            onTranscriptionComplete(result.text, true); // True to indicate "turn off auto mode"
                        } else {
                            onTranscriptionComplete(result.text);
                        }
                    }
                } catch (error) {
                    console.error("Transcription failed", error);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            // Auto mode: Record for fixed duration (5 seconds) as requested
            if (mode === 'auto') {
                const FIXED_DURATION = 5000;

                silenceTimerRef.current = setTimeout(() => {
                    stopRecordingContext();
                }, FIXED_DURATION);
            }

        } catch (err) {
            console.error("Error accessing microphone", err);
            alert("Could not access microphone");
            setIsRecording(false);
        }
    };

    const handleClick = () => {
        if (isProcessing) return;

        if (isRecording) {
            stopRecordingContext();
        } else {
            startRecording();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isProcessing || mode === 'auto'} // Disable manual click in auto mode active? Or allow it to force stop?
            // Let's allow manual stop in auto mode to "interrupt"
            type="button"
            className={`
                p-2 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 mb-0.5
                ${isRecording
                    ? 'bg-red-500/20 text-red-500 animate-pulse ring-1 ring-red-500'
                    : (mode === 'auto' ? 'bg-teal-500/10 text-teal-400' : 'text-gray-400 hover:text-white hover:bg-gray-800')
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={isRecording ? "Stop Recording" : (mode === 'auto' ? "Listening... (Auto Mode)" : "Start Voice Input")}
        >
            {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <Mic className="w-5 h-5" />
            )}
        </button>
    );
};

export default AudioRecorder;
