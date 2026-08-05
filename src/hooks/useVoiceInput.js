import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useVoiceInput — wraps the Web Speech API (SpeechRecognition).
 *
 * Returns:
 *   isSupported   – false on browsers / devices that don't support it (hides the mic button)
 *   isListening   – true while the mic is active
 *   startListening(lang) – begins recording; resolves when speech ends
 *   stopListening  – cancels recording
 *   transcript     – the latest recognised text (cleared when you call startListening again)
 *   error          – any recognition error string
 */
export function useVoiceInput() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  /**
   * @param {string} lang  BCP-47 language tag e.g. 'hi-IN', 'mr-IN', 'en-IN'
   * @returns {Promise<string>} the recognised transcript
   */
  const startListening = useCallback((lang = 'hi-IN') => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        reject(new Error('SpeechRecognition not supported'));
        return;
      }

      // Cancel any in-progress session
      recognitionRef.current?.abort();

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = lang;
      recognition.interimResults = false; // final results only
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      setTranscript('');
      setError('');
      setIsListening(true);

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        resolve(text);
      };

      recognition.onerror = (event) => {
        const msg = event.error === 'no-speech'
          ? 'No speech detected. Try again.'
          : event.error === 'not-allowed'
            ? 'Microphone permission denied.'
            : `Speech error: ${event.error}`;
        setError(msg);
        setIsListening(false);
        reject(new Error(msg));
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    });
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  return { isSupported, isListening, transcript, error, startListening, stopListening };
}
