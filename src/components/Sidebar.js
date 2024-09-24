import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";

// Define the valid earning types
const validEarningTypes = [
  'RG', 'PB', 'DT', 'NB', 'SD', 'DR', 'DN', 'NT',
  'AT', 'MK', 'AC', 'IT', 'TR', 'TC', 'TH', 'HO', 'PT'
];

const Sidebar = ({ addEntry, entries, setEditEntry, editEntry, updateEntry, copyEntry, dateInputRef, deleteEntry }) => {
  const [formData, setFormData] = useState({
    id:null,
    projectCode: "",
    projectTask: "",
    earningType: "",
    date: new Date().toISOString().split("T")[0], // Default to current date
    timeSpent: "",
    description: ""
  });
  const projectCodeRef = useRef(null);
  const [error, setError] = useState("");
  const [filteredEarningTypes, setFilteredEarningTypes] = useState(validEarningTypes);
  const [isInputFocused, setInputFocused] = useState(false);
  const [isEarningTypeInvalid, setEarningTypeInvalid] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    // Set formData if an entry is being edited
    if (editEntry) {
      setFormData(editEntry);
    } else {
      // Reset formData when not editing
      resetFormData();
    }
  }, [editEntry]);

  const resetFormData = () => {
    setFormData({
      id:null,    
      projectCode: "",
      projectTask: "",
      earningType: "",
      date: new Date().toISOString().split("T")[0],
      timeSpent: "",
      description: ""
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convert earningType input to uppercase
    const updatedValue = name === 'earningType' ? value.toUpperCase() : value;

    setFormData({ ...formData, [name]: updatedValue });

    // Filter the earning types based on input
    if (name === 'earningType') {
      const filteredTypes = validEarningTypes.filter(type => type.startsWith(updatedValue));
      setFilteredEarningTypes(filteredTypes);
      setEarningTypeInvalid(!filteredTypes.includes(updatedValue));
    }
  };

  const handleBlur = (e) => {
    if (e.target.name === 'earningType' && !validEarningTypes.includes(formData.earningType)) {
      setFormData(prevData => ({ ...prevData, earningType: "" }));
      setEarningTypeInvalid(true);
    }
    setInputFocused(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !validEarningTypes.includes(formData.earningType) ||
      !formData.projectCode ||
      !formData.projectTask ||
      !formData.date ||
      !formData.timeSpent ||
      !formData.description
    ) {
      setError("Please fill out all fields correctly.");
      return;
    } else {
      setError("");
    }

    // If editing an entry, update it; otherwise, add a new entry
    if (editEntry) {
      updateEntry(formData);
      setEditEntry(null);
    } else {
      addEntry(formData);
    }

    // Reset form after submission
    resetFormData();
    projectCodeRef.current.focus();
  };

  const handleExport = () => {
    setIsModalOpen(true);
  };

  const handleAccept = () => {
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });
  
    const csvData = filteredEntries.map(entry => ({
      "Project Code": entry.projectCode,
      "Project Task": entry.projectTask,
      "Earning Type": entry.earningType,
      "Date": entry.date,
      "Time Spent": entry.timeSpent * 60,
      "Description": entry.description,
    }));
  
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `time_entries_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsModalOpen(false);
    resetModalDates();
  };

  const resetModalDates = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleCopy = () => {
    if (editEntry) {
      copyEntry(editEntry);
      resetFormData();
    }
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
    
    if (confirmDelete) {
      deleteEntry(formData.id); // Assuming `deleteEntry` is the prop passed to the component
      // Optionally reset the form or handle any other logic after deletion
      resetFormData();
      setEditEntry(null);
    }
  };
  

  const calculateWorkingHours = () => {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
    let totalWorkingHours = 0;
    for (let day = startOfMonth; day <= endOfMonth; day.setDate(day.getDate() + 1)) {
      const dayOfWeek = day.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkingHours += 8; // 8 hours for each weekday
      }
    }
  
    const currentlyEnteredHours = entries.reduce((sum, entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentDate.getMonth() && entryDate.getFullYear() === currentDate.getFullYear()
        ? sum + parseFloat(entry.timeSpent || 0)
        : sum;
    }, 0);
  
    return { currentlyEnteredHours, totalWorkingHours };
  };
  
  const { currentlyEnteredHours, totalWorkingHours } = calculateWorkingHours();

  const calculateEarningTypePercentages = () => {
    const totalEntries = entries.length;
    const totalTimeSpent = entries.reduce((sum, entry) => sum + parseFloat(entry.timeSpent || 0), 0);
    
    const monthlyEarnings = {};
    const yearlyEarnings = {};
    const monthYear = new Date().toLocaleString("default", { month: "long", year: "numeric" });

    entries.forEach(entry => {
      const { earningType, date, timeSpent } = entry;
      const entryDate = new Date(date);
      const monthYearKey = entryDate.toLocaleString("default", { month: "long", year: "numeric" });

      if (monthYearKey === monthYear) {
        monthlyEarnings[earningType] = (monthlyEarnings[earningType] || 0) + parseFloat(timeSpent);
      }

      const yearKey = entryDate.getFullYear();
      if (!yearlyEarnings[yearKey]) {
        yearlyEarnings[yearKey] = {};
      }
      yearlyEarnings[yearKey][earningType] = (yearlyEarnings[yearKey][earningType] || 0) + parseFloat(timeSpent);
    });

    const monthlyPercentages = {};
    const yearlyPercentages = {};

    for (const [earningType, totalTime] of Object.entries(monthlyEarnings)) {
      monthlyPercentages[earningType] = ((totalTime / totalTimeSpent) * 100).toFixed(2);
    }

    for (const [year, earnings] of Object.entries(yearlyEarnings)) {
      const totalYearTimeSpent = Object.values(earnings).reduce((sum, time) => sum + time, 0);
      for (const [earningType, totalTime] of Object.entries(earnings)) {
        yearlyPercentages[earningType] = ((totalTime / totalYearTimeSpent) * 100).toFixed(2);
      }
    }

    return Object.keys(monthlyPercentages).map(earningType => ({
      earningType,
      monthPercentage: monthlyPercentages[earningType] || "0.00",
      yearPercentage: yearlyPercentages[earningType] || "0.00",
    }));
  };

  const earningTypePercentages = calculateEarningTypePercentages();

  return (
    <div className="sidebar">
      <h2>{editEntry ? "Edit Time Entry" : "Add Time Entry"}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Project Code</label>
          <input type="text" name="projectCode" ref={projectCodeRef} className="form-control" value={formData.projectCode} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Project Task</label>
          <input type="text" name="projectTask" className="form-control" value={formData.projectTask} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Earning Type</label>
          <input
            type="text"
            name="earningType"
            className={`form-control ${isEarningTypeInvalid ? 'is-invalid' : ''}`}
            value={formData.earningType}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setInputFocused(true)}
            required
          />
          {isEarningTypeInvalid && <div className="invalid-feedback">Invalid earning type.</div>}
          {isInputFocused && (
            <ul className="list-group">
              {filteredEarningTypes.map((type) => (
                <li key={type} className="list-group-item" onClick={() => handleChange({ target: { name: 'earningType', value: type } })}>
                  {type}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Date</label>
          <input type="date" name="date" className="form-control" value={formData.date} onChange={handleChange} ref={dateInputRef} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Time Spent (hours)</label>
          <input type="number" name="timeSpent" className="form-control" value={formData.timeSpent} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-control" value={formData.description} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary">{editEntry ? "Update Entry" : "Add Entry"}</button>
        {editEntry && (
            <button onClick={handleDelete} className="btn btn-danger">Delete Entry</button>
        )}
      </form>

      {isModalOpen && (
  <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
    <div className="modal show" style={{ display: 'block' }} onClick={(e) => e.stopPropagation()}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title dark">Export Time Entries</h5>
            <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
          </div>
          <div className="modal-body">
            <label className="form-label dark">Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <label className="form-label dark">End Date</label>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleAccept}>Export</button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}


      <div className="summary">
        <h3>Summary</h3>
        <p>Entered Hours: {currentlyEnteredHours} / {totalWorkingHours}</p>
        <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Earning Type</th>
              <th>Monthly %</th>
              <th>Yearly %</th>
            </tr>
          </thead>
          <tbody>
            {earningTypePercentages.map(({ earningType, monthPercentage, yearPercentage }) => (
              <tr key={earningType}>
                <td>{earningType}</td>
                <td>{monthPercentage}%</td>
                <td>{yearPercentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      <button type="button" className="btn btn-info" style={{marginTop:10}} onClick={handleExport}>Export</button>
    </div>
  );
};

export default Sidebar;
