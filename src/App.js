import React, { useState, useEffect, useRef } from 'react';
import { openDB } from 'idb';
import Sidebar from './components/Sidebar'; // Adjust the path as necessary
import TimeEntries from './components/TimeEntries'; // Adjust the path as necessary
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Optional if you want to add some styles
import './components/Sidebar.css';
import './components/TimeEntries.css';

const dbPromise = openDB('timeTrackingDB', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('entries')) {
      db.createObjectStore('entries', { keyPath: 'id' });
    }
  },
});

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
  const [deferredPrompt, setDeferredPrompt] = useState(null); // State for the install prompt
  const dateInputRef = useRef(null);

  // Load from IndexedDB on first render
  useEffect(() => {
    const loadEntries = async () => {
      const db = await dbPromise;
      const allEntries = await db.getAll('entries');
      setEntries(allEntries);
    };
    loadEntries();
  }, []);

  // Save to IndexedDB whenever entries change
  useEffect(() => {
    const saveEntries = async () => {
      const db = await dbPromise;
      await Promise.all(entries.map(entry => db.put('entries', entry)));
    };
    if (entries.length > 0) {
      saveEntries();
    }
  }, [entries]);

  const addEntry = (entry) => {
    const updatedEntries = [...entries, { ...entry, id: Date.now() }];
    setEntries(updatedEntries);
  };

  const updateEntry = (updatedEntry) => {
    const updatedEntries = entries.map(entry =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    );
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
      id: Date.now()
    };
    setNewEntry(copiedEntry);
    setEditEntry(copiedEntry);
    if (dateInputRef.current) {
      dateInputRef.current.focus();
    }
  };

  // Delete entry function
  const deleteEntry = async (id) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);

    // Delete from IndexedDB
    const db = await dbPromise;
    await db.delete('entries', id);
  };

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent the default install prompt
      setDeferredPrompt(e); // Store the event
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the install prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null); // Clear the stored prompt
      });
    }
  };

  return (
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
        deleteEntry={deleteEntry} // Pass deleteEntry to Sidebar
      />
      <TimeEntries 
        entries={entries}
        setEditEntry={setEditEntry}
        setNewEntry={setNewEntry}
        copyEntry={copyEntry}
        dateInputRef={dateInputRef}
        deleteEntry={deleteEntry} // Pass deleteEntry to TimeEntries
      />
      {/* Install Button */}
      {deferredPrompt && (
        <button onClick={handleInstallClick} className="btn btn-primary" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
          Install App
        </button>
      )}
    </div>
  );
};

export default App;
