import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TimeEntries from './components/TimeEntries';
import Settings from './components/Settings';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './components/Sidebar.css';
import './components/TimeEntries.css';

import {
  addTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry
} from './services/idbService';

const App = () => {
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

  // Load from IndexedDB on first render
  useEffect(() => {
    const loadEntries = async () => {
      const allEntries = await getTimeEntries();
      setEntries(allEntries);
    };
    loadEntries();
  }, []);

  const addEntry = async (entry) => {
    const timeEntryWithID = { ...entry, id: Date.now() };
    await addTimeEntry(timeEntryWithID);
    const updatedEntries = await getTimeEntries();
    setEntries(updatedEntries);
  };

  const updateEntry = async (updatedEntry) => {
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
      id: Date.now(),
    };
    setNewEntry(copiedEntry);
    setEditEntry(copiedEntry);
    if (dateInputRef.current) {
      dateInputRef.current.focus();
    }
  };

  const handleDeleteEntry = async (id) => {
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

  // Handle beforeinstallprompt event
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
              toggleSettings={toggleSettings} // Pass the toggleSettings function to Sidebar
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
                    closeSettings={toggleSettings} // Close the Settings component when toggling
                />
              </div>
          )}
        </div>
        {deferredPrompt && (
            <button onClick={handleInstallClick} className="btn btn-primary" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
              Install App
            </button>
        )}
      </div>
  );
};

export default App;