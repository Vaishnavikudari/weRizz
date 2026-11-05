import React, { useState, useEffect, useRef } from 'react';

import { ThemeProvider } from './context/ThemeContext';

import CameraView from './components/CameraView';

import AudioRecorder from './components/AudioRecorder';

import ChatInterface from './components/ChatInterface';

import EnrollmentForm from './components/EnrollmentForm';
import EnrolledMemoryBankView from './components/EnrolledMemoryBankView';

import AvatarCanvas from './components/AvatarCanvas';

import axios from 'axios';

import { Maximize2, Minimize2 } from 'lucide-react';



// Pages

import LandingPage from './pages/LandingPage';
import WeRizzIntro from './components/WeRizzIntro';

import LoginPage from './pages/LoginPage';

import CaregiverDashboard from './pages/CaregiverPortal';

import PatientScheduleView from './components/PatientScheduleView';

import NavBar from './components/SideNav'; // Imported as NavBar

import PatientTracking from './components/PatientTracking';

import GreetingPage from './pages/GreetingPage';

import PatientLostView from './components/PatientLostView';

import { getStoredSchedule } from './services/scheduleStore';



const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";







function App() {

  const [view, setView] = useState('landing');
  const [showIntro, setShowIntro] = useState(true);

  const currentAudioRef = useRef(null);

  const [mode, setMode] = useState('person');

  const [messages, setMessages] = useState([

    { role: 'bot', text: "Hello! Show me a face or object, or ask me a question." }

  ]);

  const [suggestions, setSuggestions] = useState([]);

  const [currentPerson, setCurrentPerson] = useState(null);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [avatarMessage, setAvatarMessage] = useState(null);

  const [isCameraExpanded, setIsCameraExpanded] = useState(true); // Default Expanded

  const [isProcessing, setIsProcessing] = useState(false);

  const [processingStatus, setProcessingStatus] = useState(""); // Granular Status



  const [enrollType, setEnrollType] = useState('person');
  const [pendingEnrollBlob, setPendingEnrollBlob] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('mavora_language') || 'en');
  const updateLanguage = (newLang) => {
    setSelectedLanguage(newLang);
    try {
      localStorage.setItem('mavora_language', newLang);
    } catch (e) {}
    const greeting = newLang === 'kn'
      ? "ನಮಸ್ಕಾರ! ಮುಖ ಅಥವಾ ವಸ್ತುವನ್ನು ತೋರಿಸಿ, ಅಥವಾ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ."
      : newLang === 'hi'
      ? "नमस्ते! कोई चेहरा या वस्तु दिखाएं, या मुझसे कोई प्रश्न पूछें।"
      : "Hello! Show me a face or object, or ask me a question.";
    setMessages([
      { role: 'bot', text: greeting }
    ]);
    speakResponse(greeting, newLang);
  };
 // 'person' or 'object'



  // UseRef to trigger camera capture from outside

  const cameraTriggerRef = useRef(null);



  const [captureTrigger, setCaptureTrigger] = useState(0);

  const [enrollData, setEnrollData] = useState(null);



  // Handlers

  const triggerScanFace = () => {

    setMode('person');

    setCaptureTrigger(Date.now());

  };



  const triggerScanObject = () => {

    setMode('object');

    setCaptureTrigger(Date.now());

  };



  const handleEnrollSave = async (data) => {

    setEnrollData({ ...data, type: enrollType });

    setMode('enroll_capture');

    setCaptureTrigger(Date.now());

  };



    const getLanguageSuggestions = (lang) => {
    if (lang === 'kn') {
      return [
        "👤 ಹೊಸ ವ್ಯಕ್ತಿಯನ್ನು ನೆನಪಿಡಿ",
        "📦 ಹೊಸ ವಸ್ತುವನ್ನು ನೆನಪಿಡಿ",
        "📍 ನನ್ನ ಮನೆಗೆ ಕರೆದೊಯ್ಯು / ಲೈವ್ GPS",
        "💊 ಇಂದು ನನ್ನ ಔಷಧಗಳು ಯಾವುವು?",
        "🕒 ನನ್ನ ಇಂದಿನ ದಿನಚರಿ ಏನು?",
        "🔍 ನನ್ನ ವಾಲೆಟ್ ಎಲ್ಲಿದೆ?",
        "👤 ರಾಹುಲ್ ಯಾರು?"
      ];
    } else if (lang === 'hi') {
      return [
        "👤 नया व्यक्ति जोड़ें",
        "📦 नई वस्तु जोड़ें",
        "📍 मुझे घर ले चलो / लाइव GPS",
        "💊 आज मेरी कौन सी दवाएं हैं?",
        "🕒 मेरा आज का शेड्यूल क्या है?",
        "🔍 मेरा बटुआ कहाँ है?",
        "👤 राहुल कौन है?"
      ];
    } else {
      return [
        "👤 Remember new person",
        "📦 Remember new item",
        "📍 Take me home / Live GPS",
        "💊 What are my medicines today?",
        "🕒 What is my schedule?",
        "🔍 Where is my wallet?",
        "👤 Who is Rahul?"
      ];
    }
  };

  useEffect(() => {
    setSuggestions(getLanguageSuggestions(selectedLanguage));
  }, [selectedLanguage]);



  const handleSuggestionClick = (text) => {
    if (text.includes("Remember new person") || text.includes("Enroll new person") || text.includes("ಹೊಸ ವ್ಯಕ್ತಿಯನ್ನು") || text.includes("नया व्यक्ति")) {
      setPendingEnrollBlob(null);
      setEnrollType('person');
      setMode('enroll_ui');
    } else if (text.includes("Remember new item") || text.includes("Enroll new object") || text.includes("ಹೊಸ ವಸ್ತುವನ್ನು") || text.includes("नई वस्तु")) {
      setPendingEnrollBlob(null);
      setEnrollType('object');
      setMode('enroll_ui');
    } else if (text.includes("Take me home") || text.includes("Live GPS") || text.includes("get lost") || text.includes("ಮನೆಗೆ") || text.includes("घर ले चलो")) {
      setView("patient_gps");
      speakResponse("Opening your live GPS and safety navigation guide.");
    } else if (text.includes("Memory Bank") || text.includes("Enrolled People")) {
      setMode("memory_bank");
    } else if (text === "Enroll new object") {

      setEnrollType('object');

      setMode('enroll_ui');

    } else {

      handleSendMessage(text);

    }

  };



  const handleCapture = async (blob) => {

    setIsProcessing(true);

    const formData = new FormData();



    if (mode === 'enroll_capture' && enrollData) {

      formData.append('file', blob, 'enroll.jpg');

      formData.append('name', enrollData.name);

      formData.append('notes', enrollData.notes);



      try {

        if (enrollData.type === 'object') {

          await axios.post(`${API_BASE}/remember/object`, formData);

          addBotMessage(`I've remembered your ${enrollData.name}.`);

          speakResponse(`I have remembered your ${enrollData.name}.`);

        } else {

          formData.append('relation', enrollData.relation);

          if (enrollData.age) formData.append('age', enrollData.age);

          if (enrollData.audioBlob) {

            formData.append('audio_file', enrollData.audioBlob, 'voice.webm');

          }

          const res = await axios.post(`${API_BASE}/remember/person`, formData);

          const enrolledImg = res.data.image_base64 || null;

          if (res.data.avatar_url) {

            addBotMessage(`I've remembered ${enrollData.name}. (Avatar Created)`, null, enrolledImg);

          } else {

            addBotMessage(`I've remembered ${enrollData.name}.`, null, enrolledImg);

          }

          speakResponse(`I have remembered ${enrollData.name}.`);

        }

        setMode('person');

        setEnrollData(null);

      } catch (e) {

        console.error(e);

        addBotMessage("Failed to enroll.");

      } finally {

        setIsProcessing(false);

      }

      return;

    }



    formData.append('file', blob, 'capture.jpg');



    try {

      let endpoint = mode === 'person' ? `${API_BASE}/recognize/person` : `${API_BASE}/find/object`;

      const res = await axios.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      const data = res.data;



      if (mode === 'person' && data.status === 'identified') {

        setCurrentPerson(data.person);

        addBotMessage(`I see ${data.person.name}.`, null, data.person.image || null);

        updateSuggestions(data.person);

        speakResponse(`Hello ${data.person.name}.`);

      } else if (mode === 'object' && data.status === 'identified') {

        const loc = data.object.location || "unknown location";

        addBotMessage(`I found your ${data.object.name}. It is usually in ${loc}.`, null, data.object.image || null);

        speakResponse(`That is your ${data.object.name}. Location: ${loc}.`);

      } else if (mode === 'object' && data.status === 'generic_detection') {

        const objects = data.objects.map(o => o.object).join(", ");

        addBotMessage(`I see: ${objects}. (Not in my personal memory)`);

        speakResponse(`I see ${objects}.`);

      } else {
        const isPersonMode = mode === 'person';
        setPendingEnrollBlob(blob);
        let unknownText = "";
        if (isPersonMode) {
          unknownText = selectedLanguage === 'kn'
            ? "ನಾನು ಈ ವ್ಯಕ್ತಿಯನ್ನು ಗುರುತಿಸಲಿಲ್ಲ. ನಾನು ಇವರನ್ನು ನೆನಪಿಟ್ಟುಕೊಳ್ಳಲು ನೀವು ಬಯಸುವಿರಾ?"
            : selectedLanguage === 'hi'
            ? "मैं इस व्यक्ति को नहीं पहचानता। क्या आप चाहते हैं कि मैं इन्हें याद रखूँ?"
            : "I don't recognize this person yet. Would you like me to remember them?";
        } else {
          unknownText = selectedLanguage === 'kn'
            ? "ನಾನು ಈ ವಸ್ತುವನ್ನು ಗುರುತಿಸಲಿಲ್ಲ. ನಾನು ಇದನ್ನು ನೆನಪಿಟ್ಟುಕೊಳ್ಳಲು ನೀವು ಬಯಸುವಿರಾ?"
            : selectedLanguage === 'hi'
            ? "मैं इस वस्तु को नहीं पहचानता। क्या आप चाहते हैं कि मैं इसे याद रखूँ?"
            : "I don't recognize this item yet. Would you like me to remember where you keep it?";
        }

        addBotMessage(
          unknownText, 
          null, 
          null, 
          [], 
          { type: isPersonMode ? 'enroll_person_prompt' : 'enroll_object_prompt', blob }
        );
        speakResponse(unknownText);
        setSuggestions([
          isPersonMode 
            ? (selectedLanguage === 'kn' ? "👤 ಈ ವ್ಯಕ್ತಿಯನ್ನು ನೆನಪಿಡಿ" : selectedLanguage === 'hi' ? "👤 इस व्यक्ति को जोड़ें" : "👤 Remember this person")
            : (selectedLanguage === 'kn' ? "📦 ಈ ವಸ್ತುವನ್ನು ನೆನಪಿಡಿ" : selectedLanguage === 'hi' ? "📦 इस वस्तु को जोड़ें" : "📦 Remember this item"),
          ...getLanguageSuggestions(selectedLanguage)
        ]);
      }

    } catch (err) {

      console.error(err);

      addBotMessage("Error processing image.");

    } finally {

      setIsProcessing(false);

    }

  };



  const updateSuggestions = (person) => {

    setSuggestions([

      `Who is ${person.name}?`,

      `How does ${person.name} talk?`,

      `Any notes on ${person.name}?`

    ]);

  };



  const handleSendMessage = async (text) => {

    setIsProcessing(true);

    setProcessingStatus("Accessing Memory Bank...");



    // Simulate steps for better UX

    const statusInterval = setInterval(() => {

      setProcessingStatus(prev => {

        if (prev === "Accessing Memory Bank...") return "Consulting LLM Cortex...";

        if (prev === "Consulting LLM Cortex...") return "Synthesizing Response...";

        return prev;

      });

    }, 1500);



    setMessages(prev => [...prev, { role: 'user', text }]);

    let responseText = "I'm not sure about that.";

    let audioUrl = null;

    let imageBase64 = null;



    try {

      if (currentPerson && (text.toLowerCase().includes("talk") || text.toLowerCase().includes("voice"))) {

        // ... existing voice logic ...

        if (currentPerson.audio) {

          responseText = `Here is the voice of ${currentPerson.name}.`;

          try {

            const binaryString = window.atob(currentPerson.audio);

            const bytes = new Uint8Array(binaryString.length);

            for (let i = 0; i < binaryString.length; i++) {

              bytes[i] = binaryString.charCodeAt(i);

            }

            const blob = new Blob([bytes], { type: 'audio/webm' });

            audioUrl = URL.createObjectURL(blob);

          } catch (e) {

            responseText = "I found a voice record but couldn't play it.";

          }

        } else {

          responseText = `I don't have a voice sample for ${currentPerson.name}.`;

        }



        clearInterval(statusInterval);

        setProcessingStatus("Retrieving Voice Sample...");



        setTimeout(() => {

          addBotMessage(responseText, audioUrl);

          speakResponse(responseText);

          setIsProcessing(false);

          setProcessingStatus("");

        }, 800);

        return;

      }



      const res = await axios.post(`${API_BASE}/chat/query`, { text, schedule: getStoredSchedule(), language: selectedLanguage });



      clearInterval(statusInterval);

      setProcessingStatus("Finalizing...");



      const data = res.data;

      if (data.status === 'found') {

        responseText = data.text;

        if (data.audio_base64) {

          try {

            const binaryString = window.atob(data.audio_base64);

            const bytes = new Uint8Array(binaryString.length);

            for (let i = 0; i < binaryString.length; i++) {

              bytes[i] = binaryString.charCodeAt(i);

            }

            const blob = new Blob([bytes], { type: 'audio/webm' });

            audioUrl = URL.createObjectURL(blob);

          } catch (e) { }

        }

        if (data.image_base64) {
          imageBase64 = data.image_base64;
        } else {
          imageBase64 = null;
        }

        if (data.person) {

          setCurrentPerson(data.person);

          updateSuggestions(data.person);

        } else {
          setCurrentPerson(null);
          setSuggestions(getLanguageSuggestions(selectedLanguage));
        }

      } else {

        responseText = data.text || (selectedLanguage === 'kn' ? "ಸ್ಮೃತಿಯಲ್ಲಿ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ." : selectedLanguage === 'hi' ? "स्मृति में जानकारी उपलब्ध नहीं है।" : "Information not available in memory.");
        imageBase64 = null;
        setCurrentPerson(null);
        setSuggestions(getLanguageSuggestions(selectedLanguage));

      }

      addBotMessage(responseText, audioUrl, imageBase64, data.gallery);

      speakResponse(responseText);

    } catch (e) {

      clearInterval(statusInterval);

      console.error(e);

      responseText = "I had trouble searching my memory.";

      addBotMessage(responseText);

      speakResponse(responseText);

    } finally {

      if (!((currentPerson && (text.toLowerCase().includes("talk") || text.toLowerCase().includes("voice"))))) {

        setIsProcessing(false);

        setProcessingStatus("");

      }

    }

  };



  const addBotMessage = (text, audioUrl = null, imageBase64 = null, gallery = []) => {

    setMessages(prev => [...prev, { role: 'bot', text, audioUrl, image: imageBase64, gallery }]);

  };



  const speakResponse = async (text, lang = null) => {
    const resolvedLang = lang || selectedLanguage || 'en';

    if (!text || !text.trim()) return;

    setIsSpeaking(true);

    setAvatarMessage(text);



    if (currentAudioRef.current) {

      try {

        currentAudioRef.current.pause();

      } catch (e) {}

      currentAudioRef.current = null;

    }



    try {

      const apiKey = localStorage.getItem('elevenlabs_api_key') || '';

      const voiceId = localStorage.getItem('elevenlabs_voice_id') || '21m00Tcm4TlvDq8ikWAM';



      const response = await fetch(`${API_BASE}/tts`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          text: text,

          voice_id: voiceId,

          api_key: apiKey || undefined,

          language: resolvedLang

        })

      });



      if (!response.ok) throw new Error('TTS response error');



      const blob = await response.blob();

      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);

      currentAudioRef.current = audio;



      audio.onplay = () => {

        setIsSpeaking(true);

      };



      audio.onended = () => {

        setIsSpeaking(false);

        setAvatarMessage(null);

        URL.revokeObjectURL(audioUrl);

        currentAudioRef.current = null;

      };



      audio.onerror = () => {

        setIsSpeaking(false);

        setAvatarMessage(null);

        currentAudioRef.current = null;

      };



      await audio.play();

    } catch (err) {

      console.warn("Falling back to browser speech synthesis:", err);

      try {

        const utterance = new SpeechSynthesisUtterance(text);
        if (resolvedLang === 'kn') utterance.lang = 'kn-IN';
        else if (resolvedLang === 'hi') utterance.lang = 'hi-IN';
        else utterance.lang = 'en-IN';

        utterance.onend = () => {

          setIsSpeaking(false);

          setAvatarMessage(null);

        };

        utterance.onerror = () => {

          setIsSpeaking(false);

          setAvatarMessage(null);

        };

        window.speechSynthesis.speak(utterance);

      } catch (e) {

        setIsSpeaking(false);

        setAvatarMessage(null);

      }

    }

  };



  // VIEW ROUTING

  let content;

  if (view === 'landing') {

    content = <LandingPage onGetStarted={() => setView('patient')} onLaunchPatient={() => setView('patient')} onLaunchFamily={() => setView('caregiver')} />;

  }

  else if (view === 'login') {

    content = (

      <LoginPage onSelectRole={(role) => {

        if (role === 'caregiver') setView('caregiver');

        else setView('patient');

      }} />

    );

  }

  else if (view === 'caregiver') {

    content = <CaregiverDashboard />;

  } else if (view === 'tracking') {

    content = <PatientTracking userRole='family' />;

  } else if (view === 'greeting') {

    content = (

      <GreetingPage

        onStartChat={() => setView('patient')}

        onOpenSchedule={() => setView('patient_schedule')}

        onStartScan={() => {

          setView('patient');

          setMode('person');

          setCaptureTrigger(Date.now());

        }}

        onOpenLost={() => setView('patient_gps')}

        onSpeakText={(text) => speakResponse(text)}

      />

    );

  } else if (view === 'patient_schedule') {

    content = <PatientScheduleView />;

  } else if (view === 'enroll_person') {
    content = (
      <EnrollmentForm
        type="person"
        initialPhoto={pendingEnrollBlob}
        onCancel={() => { setPendingEnrollBlob(null); setView('patient'); }}
        onSuccess={(saved) => {
          setPendingEnrollBlob(null);
          setView('patient');
          if (saved) {
            addBotMessage(`I have remembered ${saved.name}.`, null, saved.image_base64 || null);
            speakResponse(`I have remembered ${saved.name}.`);
          }
        }}
      />
    );
  } else if (view === 'enroll_object') {
    content = (
      <EnrollmentForm
        type="object"
        initialPhoto={pendingEnrollBlob}
        onCancel={() => { setPendingEnrollBlob(null); setView('patient'); }}
        onSuccess={(saved) => {
          setPendingEnrollBlob(null);
          setView('patient');
          if (saved) {
            addBotMessage(`I have remembered your ${saved.name}.`, null, saved.image_base64 || null);
            speakResponse(`I have remembered your ${saved.name}.`);
          }
        }}
      />
    );
  } else if (view === 'patient_gps') {
    content = (
      <PatientTracking 
        userRole="patient" 
        onBack={() => setView("patient")} 
        onSpeakText={(text) => speakResponse(text)} 
      />
    );
  } else if (view === 'patient_lost') {

    content = <PatientLostView onSpeakText={(text) => speakResponse(text)} />;

  } else {

    // Patient App Content

    content = (

      <div className="app-container">

        {/* MAIN STAGE (FULL WIDTH) */}

        <div className="main-stage">

          <div className="avatar-zone">

            <AvatarCanvas isSpeaking={isSpeaking} isProcessing={isProcessing} processingStatus={processingStatus} message={avatarMessage} />

          </div>

          <div className="chat-zone">

            {mode === 'enroll_ui' ? (
              <EnrollmentForm
                type={enrollType}
                initialPhoto={pendingEnrollBlob}
                onCancel={() => { setPendingEnrollBlob(null); setMode('person'); }}
                onSave={handleEnrollSave}
                onSuccess={(saved) => {
                  setPendingEnrollBlob(null);
                  setMode('memory_bank');
                  if (saved) {
                    addBotMessage(`I have remembered ${saved.name}.`, null, saved.image_base64 || null);
                    speakResponse(`I have remembered ${saved.name}.`);
                  }
                }}
              />

            ) : mode === 'memory_bank' ? (
              <EnrolledMemoryBankView
                onBack={() => setMode('person')}
                onEnrollNew={() => { setEnrollType('person'); setMode('enroll_ui'); }}
                onSpeakText={(text) => speakResponse(text)}
              />

            ) : (

              <ChatInterface

                messages={messages}

                onSendMessage={handleSendMessage}

                suggestions={suggestions}

                onSuggestionClick={handleSuggestionClick}

                onPlayAudio={(url) => new Audio(url).play()}

                onCapture={handleCapture}

                onScanFace={() => { setMode('person'); }}

                onScanObject={() => { setMode('object'); }}

                onEnroll={() => { setEnrollType('person'); setMode('enroll_ui'); }}

                onEnrollObject={() => { setEnrollType('object'); setMode('enroll_ui'); }}
                onOpenMemoryBank={() => setMode('memory_bank')}
                onOpenGPS={() => {
                  setView('patient_gps');
                  speakResponse('Opening your live GPS and safety navigation guide.');
                }}

                isTyping={isProcessing}

                typingStatus={processingStatus}

                captureTrigger={captureTrigger}

                enrollType={enrollType}

                language={selectedLanguage}

                onLanguageChange={updateLanguage}

                onSpeakResponse={(t) => speakResponse(t, selectedLanguage)}

              />

            )}

          </div>

        </div>



        <style>{`

        :root { --bg: #070D1E; --surface: #0B1736; --primary: #FFFFFF; --text: #FFFFFF; }

        .app-container {

            display: flex;

            height: 100%;

            width: 100%;

            background: transparent;

            color: var(--text);

            overflow: hidden;

            flex-direction: row;

        }

        .main-stage {

            flex: 1;

            display: flex;

            flex-direction: row;

            height: 100%;

            width: 100%;

            position: relative;

            background: transparent;

            overflow: hidden;

        }

        .avatar-zone {

            width: 480px;

            height: 100%;

            position: relative;

            background: transparent;

            flex-shrink: 0;

            z-index: 10;

        }

        .chat-zone {

            flex: 1;

            height: 100%;

            width: 100%;

            padding: 0;

            display: flex;

            overflow: hidden;

            background: transparent;

        }

      `}</style>

      </div>

    );

  }



  const handleScrollToSection = (sectionId) => {

    if (view !== 'landing') {

      setView('landing');

      setTimeout(() => {

        const el = document.getElementById(sectionId);

        if (el) el.scrollIntoView({ behavior: 'smooth' });

      }, 100);

    } else {

      const el = document.getElementById(sectionId);

      if (el) el.scrollIntoView({ behavior: 'smooth' });

    }

  };



  return (

    <ThemeProvider>
      {showIntro && <WeRizzIntro onComplete={() => setShowIntro(false)} />}

      <div className="fixed inset-0 w-screen h-screen flex flex-col bg-[#070D1E] text-white transition-colors duration-300 overflow-hidden">

        

        {/* Dark Royal Blue with Flowing Ethereal White Clouds */}
        <div className="royal-cloud-background" aria-hidden="true">
        <div className="continuous-cloud-stream">
          <div className="continuous-cloud cloud-loop-1" />
          <div className="continuous-cloud cloud-loop-2" />
          <div className="continuous-cloud cloud-loop-3" />
          <div className="continuous-cloud-lower cloud-loop-4" />
          <div className="continuous-cloud-lower cloud-loop-5" />
        </div>
      </div>
        <div className="ribbed-glass-overlay" aria-hidden="true" />



        {/* Subtle Noise Texture */}

        <div className="noise-overlay" aria-hidden="true" />



        {/* Fixed Top Navbar */}

        <NavBar 

          onViewChange={setView} 

          currentView={view} 

          onScrollToSection={handleScrollToSection}

        />



        {/* Full Viewport App Content Under 70px Nav */}

        <main className={`relative z-10 w-full flex-1 mt-[70px] h-[calc(100vh-70px)] ${view === 'patient' ? 'overflow-hidden' : 'overflow-y-auto'}`}>



          {content}

        </main>

      </div>

    </ThemeProvider>

  );

}



export default App;

