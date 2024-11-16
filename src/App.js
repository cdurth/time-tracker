import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from "dexie-react-hooks";
import Sidebar from './components/Sidebar';
import TimeEntries from './components/TimeEntries';
import Settings from './components/Settings';
import { db } from './services/idbService';
import {
  addTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  signIn,
  signUp,
  signOut
} from './services/idbService';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './components/Sidebar.css';
import './components/TimeEntries.css';
import './components/Settings.css';

const App = () => {
  const user = useLiveQuery(async () => {
    const currentUser = await db.cloud.currentUser;
    console.log('Current user:', currentUser);
    
    if (!currentUser || currentUser.userId === "unauthorized" || currentUser.name === "Unauthorized") {
      return null;
    }
    
    return currentUser;
  });

  const [entries, setEntries] = useState([]);
  const [editEntry, setEditEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    projectCode: '',
    projectTask: '',
    earningType: '',
    date: '',
    timeSpent: '',
    description: '',
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [settingsData, setSettingsData] = useState({
    setting1: 'default1',
    setting2: 'default2',
  });
  const dateInputRef = useRef(null);

  useEffect(() => {
    const loadEntries = async () => {
      if (user) {
        try {
          const allEntries = await getTimeEntries();
          setEntries(allEntries);
        } catch (error) {
          console.error('Error loading entries:', error);
          setEntries([]);
        }
      } else {
        setEntries([]);
      }
    };
    loadEntries();
  }, [user]);

  const addEntry = async (entry) => {
    if (!user) return;
    // Don't generate an ID, let Dexie handle it
    await addTimeEntry(entry);
    const updatedEntries = await getTimeEntries();
    setEntries(updatedEntries);
};

  const updateEntry = async (updatedEntry) => {
    if (!user) return;
    await updateTimeEntry(updatedEntry);
    const updatedEntries = await getTimeEntries();
    setEntries(updatedEntries);
    setEditEntry(null);
  };

  const copyEntry = (entry) => {
    const copiedEntry = {
      projectCode: entry.projectCode,
      projectTask: entry.projectTask,
      earningType: entry.earningType,
      date: new Date(entry.date + "T00:00:00").toLocaleDateString('en-US'),
      timeSpent: entry.timeSpent,
      description: entry.description,
      id: crypto.randomUUID(),
    };
    setNewEntry(copiedEntry);
    setEditEntry(copiedEntry);
    if (dateInputRef.current) {
      dateInputRef.current.focus();
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!user) return;
    await deleteTimeEntry(id);
    const updatedEntries = await getTimeEntries();
    setEntries(updatedEntries);
  };

  const toggleSettings = () => {
    setIsSettingsVisible(!isSettingsVisible);
  };

  const saveSettings = (newSettings) => {
    setSettingsData(newSettings);
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setEntries([]);
      setEditEntry(null);
      setNewEntry({
        projectCode: '',
        projectTask: '',
        earningType: '',
        date: '',
        timeSpent: '',
        description: '',
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (user === undefined) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Settings
              settingsData={settingsData}
              saveSettings={saveSettings}
              closeSettings={() => {}}
              user={user}
              onSignIn={async (email, password) => {
                try {
                  await signIn(email, password);
                } catch (error) {
                  console.error('Sign in error:', error);
                  throw error;
                }
              }}
              onSignUp={async (email, password) => {
                try {
                  await signUp(email, password);
                } catch (error) {
                  console.error('Sign up error:', error);
                  throw error;
                }
              }}
              onSignOut={handleSignOut}
              authMode={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex" }}>
        <Sidebar
          addEntry={addEntry}
          entries={entries}
          setEditEntry={setEditEntry}
          editEntry={editEntry}
          updateEntry={updateEntry}
          copyEntry={copyEntry}
          newEntry={newEntry}
          setNewEntry={setNewEntry}
          dateInputRef={dateInputRef}
          deleteEntry={handleDeleteEntry}
          toggleSettings={toggleSettings}
          user={user}
          onSignOut={handleSignOut}
        />
        {!isSettingsVisible && (
          <TimeEntries
            entries={entries}
            setEditEntry={setEditEntry}
            setNewEntry={setNewEntry}
            copyEntry={copyEntry}
            dateInputRef={dateInputRef}
            deleteEntry={handleDeleteEntry}
          />
        )}
        {isSettingsVisible && (
          <div style={{ flexGrow: 1 }}>
            <Settings
              settingsData={settingsData}
              saveSettings={saveSettings}
              closeSettings={toggleSettings}
              user={user}
              onSignIn={async (email, password) => {
                try {
                  await signIn(email, password);
                } catch (error) {
                  console.error('Sign in error:', error);
                  throw error;
                }
              }}
              onSignUp={async (email, password) => {
                try {
                  await signUp(email, password);
                } catch (error) {
                  console.error('Sign up error:', error);
                  throw error;
                }
              }}
              onSignOut={handleSignOut}
              authMode={false}
            />
          </div>
        )}
      </div>
      {deferredPrompt && (
        <button 
          onClick={handleInstallClick} 
          className="btn btn-primary" 
          style={{ position: 'fixed', bottom: '20px', right: '20px' }}
        >
          Install App
        </button>
      )}
    </div>
  );
};

export default App;