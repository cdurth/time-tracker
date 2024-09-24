import React, { useState, useEffect } from "react";
import Papa from "papaparse";

// Define the valid earning types
const validEarningTypes = [
  'RG', 'PB', 'DT', 'NB', 'SD', 'DR', 'DN', 'NT',
  'AT', 'MK', 'AC', 'IT', 'TR', 'TC', 'TH', 'HO', 'PT'
];

const Sidebar = ({ addEntry, entries, setEditEntry, editEntry, updateEntry, copyEntry, dateInputRef }) => {
  const [formData, setFormData] = useState({
    projectCode: "",
    projectTask: "",
    earningType: "",
    date: new Date().toISOString().split("T")[0], // Default to current date
    timeSpent: "",
    description: ""
  });

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
      setFormData({
        projectCode: "",
        projectTask: "",
        earningType: "",
        date: new Date().toISOString().split("T")[0],
        timeSpent: "",
        description: ""
      });
    }
  }, [editEntry]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Convert earningType input to uppercase
    const updatedValue = name === 'earningType' ? value.toUpperCase() : value;

    setFormData({ ...formData, [name]: updatedValue });

    // Filter the earning types based on input
    if (name === 'earningType') {
      // Update the filtered earning types based on the input value
      const filteredTypes = validEarningTypes.filter(type => type.startsWith(updatedValue));
      setFilteredEarningTypes(filteredTypes);
      setEarningTypeInvalid(!filteredTypes.includes(updatedValue));
    }
  };

  const handleBlur = (e) => {
    if (e.target.name === 'earningType' && !validEarningTypes.includes(formData.earningType)) {
      setFormData({ ...formData, earningType: "" });
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
      updateEntry(formData); // Call updateEntry if editing
      setEditEntry(null); // Clear editEntry after updating
    } else {
      addEntry(formData); // Call addEntry for new entries
    }

    // Reset form after submission
    setFormData({
      projectCode: "",
      projectTask: "",
      earningType: "",
      date: new Date().toISOString().split("T")[0],
      timeSpent: "",
      description: ""
    });
  };

  const handleExport = () => {
    setIsModalOpen(true);
  };

  const handleAccept = () => {
    // Filter entries based on the date range
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });
  
    // Convert the filtered entries to CSV format
    const csvData = filteredEntries.map(entry => ({
      "Project Code": entry.projectCode,
      "Project Task": entry.projectTask,
      "Earning Type": entry.earningType,
      "Date": entry.date, // Ensure this is already in MM/DD/YYYY format
      "Time Spent": entry.timeSpent * 60,
      "Description": entry.description,
    }));
  
    const csv = Papa.unparse(csvData);
  
    // Create a Blob from the CSV string
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
    // Create a download link and trigger download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `time_entries_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
  
    // Clean up by removing the link
    document.body.removeChild(link);
  
    // Close the modal
    setIsModalOpen(false);
    setStartDate("");
    setEndDate("");
  };

  const handleCopy = () => {
    if (editEntry) {
      // Copy entry data for a new entry
      copyEntry(editEntry);
      // Reset formData after copying
      setFormData({
        projectCode: "",
        projectTask: "",
        earningType: "",
        date: new Date().toISOString().split("T")[0],
        timeSpent: "",
        description: ""
      });
    }
  };

  const calculateWorkingHours = () => {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
    let totalWorkingHours = 0;
    for (let day = startOfMonth; day <= endOfMonth; day.setDate(day.getDate() + 1)) {
      const dayOfWeek = day.getDay();
      // Count weekdays (Monday to Friday)
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
  
  // Usage
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

    // Calculate monthly percentages
    for (const [earningType, totalTime] of Object.entries(monthlyEarnings)) {
      monthlyPercentages[earningType] = ((totalTime / totalTimeSpent) * 100).toFixed(2);
    }

    // Calculate yearly percentages
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
          <input type="text" name="projectCode" className="form-control" value={formData.projectCode} onChange={handleChange} required />
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
            list="earningTypes"
            required
          />
          {isInputFocused && (
            <datalist id="earningTypes">
              {filteredEarningTypes.map(type => (
                <option key={type} value={type} />
              ))}
            </datalist>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Date</label>
          <input type="date" name="date" className="form-control" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Time Spent (in hours)</label>
          <input type="number" name="timeSpent" className="form-control" value={formData.timeSpent} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-control" value={formData.description} onChange={handleChange} required></textarea>
        </div>
        <button type="submit" className="btn btn-primary">Add Entry</button>
      </form>


      <h3>Currently Entered Hours</h3>
      <div>{currentlyEnteredHours} / {totalWorkingHours}</div>

      <h3>Earning Type Percentages</h3>
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
      <button className="btn btn-warning" onClick={handleExport}>Export Time</button>
      {/* Modal for Export */}
      {isModalOpen && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2 className="dark">Export Time Entries</h2>
      <div className="mb-3">
        <label className="form-label dark">Start Date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-control" />
      </div>
      <div className="mb-3">
        <label className="form-label dark">End Date</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control" />
      </div>
      <button className="btn btn-success w-100" onClick={handleAccept}>Accept</button>
      <button className="btn btn-secondary w-100" onClick={() => setIsModalOpen(false)}>Cancel</button>
    </div>
  </div>
)}

    </div>
  );
};

export default Sidebar;
