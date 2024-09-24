import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import TimeEntries from "./components/TimeEntries";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Optional if you want to add some styles
import './components/Sidebar.css';
import './components/TimeEntries.css';

const App = () => {
  const [entries, setEntries] = useState([]);
  const [editEntry, setEditEntry] = useState(null); // State for the entry being edited
  const [newEntry, setNewEntry] = useState({ // State for new entry
    projectCode: '',
    projectTask: '',
    earningType: '',
    date: '',
    timeSpent: '',
    description: '',
  });
  const dateInputRef = useRef(null);

  // Load from localStorage on first render
  useEffect(() => {
    const savedEntries = localStorage.getItem("timeEntries");
    if (savedEntries) {
      try {
        const parsedEntries = JSON.parse(savedEntries);
        setEntries(parsedEntries);
      } catch (error) {
        console.error("Error parsing saved entries:", error);
        setEntries([]); // Reset to an empty array on error
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save to localStorage whenever entries change
  useEffect(() => {
    if (entries.length > 0) { // Save only if there are entries
      localStorage.setItem("timeEntries", JSON.stringify(entries));
    }
  }, [entries]);

  // Add new entry to state
  const addEntry = (entry) => {
    const updatedEntries = [...entries, { ...entry, id: Date.now() }]; // Adding a unique ID
    setEntries(updatedEntries);
  };

  // Function to handle updating an existing entry
  const updateEntry = (updatedEntry) => {
    const updatedEntries = entries.map(entry =>
      entry.id === updatedEntry.id ? updatedEntry : entry // Update by unique ID
    );
    setEntries(updatedEntries);
    setEditEntry(null); // Clear the editEntry state after updating
  };

  // Function to copy an entry
  const copyEntry = (entry) => {
    const copiedEntry = {
      projectCode: entry.projectCode,
      projectTask: entry.projectTask,
      earningType: entry.earningType,
      date: new Date(entry.date + "T00:00:00").toLocaleDateString('en-US'), // Format date
      timeSpent: entry.timeSpent,
      description: entry.description,
      id: Date.now() // Ensure a unique ID
    };
    setNewEntry(copiedEntry); // Set the new entry state for the sidebar
    setEditEntry(copiedEntry); // Set the editEntry to the copied entry for editing
    if (dateInputRef.current) {
      dateInputRef.current.focus(); // Focus on the date input if it exists
    }
  };

  return (
    <div style={{ display: "flex" }}>
      {/* Pass entries and the copy function to Sidebar */}
      <Sidebar
        addEntry={addEntry}
        entries={entries}
        setEditEntry={setEditEntry}
        editEntry={editEntry}
        updateEntry={updateEntry}
        copyEntry={copyEntry} // Pass the copyEntry function to Sidebar
        newEntry={newEntry} // Pass the newEntry state to the Sidebar
        setNewEntry={setNewEntry} // Pass setNewEntry to the Sidebar
        dateInputRef={dateInputRef}
      />
      <TimeEntries 
        entries={entries} 
        setEditEntry={setEditEntry} 
        setNewEntry={setNewEntry} // Pass the setNewEntry function
        copyEntry={copyEntry} // Pass the copyEntry function directly
        dateInputRef={dateInputRef}
      />
    </div>
  );
};

export default App;
