import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getProjectCodes, getProjectTasksByCode } from '../services/idbService';

const validEarningTypes = ['RG', 'PB', 'DT', 'NB', 'SD', 'DR', 'DN', 'NT', 'AT', 'MK', 'AC', 'IT', 'TR', 'TC', 'TH', 'HO', 'PT'];

const Sidebar = ({ addEntry, entries, setEditEntry, editEntry, updateEntry, copyEntry, dateInputRef, deleteEntry, toggleSettings }) => {
    // State declarations
    const [formData, setFormData] = useState({
        id: null,
        projectCode: "",
        projectTask: "",
        earningType: "",
        date: new Date().toISOString().split("T")[0],
        timeSpent: "",
        description: ""
    });

    // Define the months
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // Default to the current month
    const [projectCodes, setProjectCodes] = useState([]);
    const [projectTasks, setProjectTasks] = useState([]);
    const projectCodeRef = useRef(null);
    const [error, setError] = useState("");
    const [filteredEarningTypes, setFilteredEarningTypes] = useState(validEarningTypes);
    const [filteredProjectCodes, setFilteredProjectCodes] = useState([]);
    const [filteredProjectTasks, setFilteredProjectTasks] = useState([]);
    const [focusedField, setFocusedField] = useState("");
    const [projectCodeInvalid, setProjectCodeInvalid] = useState(false);
    const [earningTypeInvalid, setEarningTypeInvalid] = useState(false);
    const [projectTaskInvalid, setProjectTaskInvalid] = useState(false);
    const [tasksLoading, setTasksLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        async function loadProjectCodes() {
            const codes = await getProjectCodes();
            setProjectCodes(codes);
        }
        loadProjectCodes();
    }, []);

    useEffect(() => {
        if (editEntry) {
            setFormData(editEntry);
            loadProjectTasks(editEntry.projectCode);
        } else {
            resetFormData();
        }
    }, [editEntry]);

    const loadProjectTasks = async (projectCode) => {
        setTasksLoading(true);
        const tasks = await getProjectTasksByCode(projectCode);
        setProjectTasks(tasks);
        setFilteredProjectTasks(tasks);
        setTasksLoading(false);
    };

    const resetFormData = () => {
        setFormData({
            id: null,
            projectCode: "",
            projectTask: "",
            earningType: "",
            date: new Date().toISOString().split("T")[0],
            timeSpent: "",
            description: ""
        });
        setProjectTasks([]);
        setFilteredProjectTasks([]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let updatedValue = value;
        if (name === 'earningType') {
            updatedValue = value.toUpperCase();
            const filteredTypes = validEarningTypes.filter((type) => type.startsWith(updatedValue));
            setFilteredEarningTypes(filteredTypes);
            setEarningTypeInvalid(!filteredTypes.includes(updatedValue));
        }

        if (name === 'projectCode') {
            const filteredCodes = projectCodes.filter((codeObj) =>
                codeObj.code && codeObj.code.toLowerCase().includes(updatedValue.toLowerCase())
            );
            setFilteredProjectCodes(filteredCodes.map(codeObj => codeObj.code));
            setProjectCodeInvalid(!filteredCodes.some(codeObj => codeObj.code.toLowerCase() === updatedValue.toLowerCase()));
            setFormData({ ...formData, projectTask: "" });
            loadProjectTasks(updatedValue);
        }

        if (name === 'projectTask') {
            const filteredTasks = projectTasks.filter((task) =>
                task.task && task.task.toLowerCase().includes(updatedValue.toLowerCase())
            );
            setFilteredProjectTasks(filteredTasks);
            setProjectTaskInvalid(!projectTasks.some(task => task.task.toLowerCase() === updatedValue.toLowerCase()));
        }

        setFormData({ ...formData, [name]: updatedValue });
    };

    const handleInputBlur = (e) => {
        const { name } = e.target;

        if (name === 'earningType' && !validEarningTypes.includes(formData.earningType)) {
            setFormData((prevData) => ({ ...prevData, earningType: "" }));
            setEarningTypeInvalid(true);
        }

        if (name === 'projectCode') {
            const isValidProjectCode = projectCodes.some(codeObj => codeObj.code.toLowerCase() === formData.projectCode.toLowerCase());
            if (!isValidProjectCode) {
                setFormData((prevData) => ({ ...prevData, projectCode: "" }));
                setProjectCodeInvalid(true);
            }
        }

        if (name === 'projectTask') {
            const isValidTask = projectTasks.some(task => task.task.toLowerCase() === formData.projectTask.toLowerCase());
            if (!isValidTask) {
                setFormData((prevData) => ({ ...prevData, projectTask: "" }));
                setProjectTaskInvalid(true);
            } else {
                setProjectTaskInvalid(false);
            }
        }

        setFocusedField("");
    };

    const handleInputFocus = async (e) => {
        setFocusedField(e.target.name);
        if (e.target.name === 'projectTask' && formData.projectCode && projectTasks.length === 0 && !tasksLoading) {
            await loadProjectTasks(formData.projectCode);
            setFilteredProjectTasks(projectTasks);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (!formData.projectCode || !formData.projectTask || !formData.earningType || !formData.date || !formData.timeSpent || !formData.description) {
            setError("Please fill out all fields correctly.");
            return;
        } else {
            setError("");
        }

        if (editEntry) {
            updateEntry(formData);
            setEditEntry(null);
        } else {
            addEntry(formData);
        }

        resetFormData();
        projectCodeRef.current.focus();
    };

    const handleEditCancel = () => {
        setEditEntry(null);
        projectCodeRef.current.focus();
    }

    // Handle month change
    const handleMonthChange = (e) => {
        setSelectedMonth(parseInt(e.target.value));
    };

    const exportToCSV = () => {
        setIsModalOpen(true);
    };

    const generateCSV = () => {
        const filteredEntries = entries.filter((entry) => {
            const entryDate = new Date(entry.date);
            return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
        });

        const csvData = filteredEntries.map((entry) => ({
            "Project": entry.projectCode,
            "Project Task": entry.projectTask,
            "Earning Type": entry.earningType,
            "Date": entry.date + " 00:00:00.000",
            "Time Spent": entry.timeSpent * 60,
            "Description": entry.description.replace(/[\r\n]+/g, ' '),
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

    const deleteExistingEntry = () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
        if (confirmDelete) {
            deleteEntry(formData.id);
            resetFormData();
            setEditEntry(null);
        }
    };
    // Function to parse date without timezone shifting
    const parseDateWithoutShift = (dateString) => {
        const parts = dateString.split("-");
        return new Date(parts[0], parts[1] - 1, parts[2]);
    };
    const calculateWorkingHours = () => {
        const currentYear = currentDate.getFullYear();
        const startOfMonth = new Date(currentYear, selectedMonth, 1);
        const endOfMonth = new Date(currentYear, selectedMonth + 1, 0);

        let totalWorkingHours = 0;
        for (let day = new Date(startOfMonth); day <= endOfMonth; day.setDate(day.getDate() + 1)) {
            const dayOfWeek = day.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                totalWorkingHours += 8;
            }
        }

        const currentlyEnteredHours = entries.reduce((sum, entry) => {
            const entryDate = parseDateWithoutShift(entry.date);
            return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === currentYear
                ? sum + parseFloat(entry.timeSpent || 0)
                : sum;
        }, 0);

        return { currentlyEnteredHours, totalWorkingHours };
    };

    const { currentlyEnteredHours, totalWorkingHours } = calculateWorkingHours();


    const calculateEarningTypePercentages = () => {
        if (entries.length === 0) return [];

        const currentYear = currentDate.getFullYear();

        // Initialize containers for monthly and yearly aggregates
        const monthly = {};
        const yearly = {};

        // Function to add time to a dictionary
        const addTimeToDictionary = (dict, earningType, timeSpent) => {
            dict[earningType] = (dict[earningType] || 0) + parseFloat(timeSpent);
        };

        // Process all entries
        entries.forEach((entry) => {
            const { earningType, date, timeSpent } = entry;
            const entryDate = parseDateWithoutShift(date);
            const entryYear = entryDate.getFullYear();
            const entryMonth = entryDate.getMonth();

            // Accumulate time for selected month entries
            if (entryYear === currentYear && entryMonth === selectedMonth) {
                addTimeToDictionary(monthly, earningType, timeSpent);
            }

            // Accumulate time for current year entries
            if (entryYear === currentYear) {
                addTimeToDictionary(yearly, earningType, timeSpent);
            }
        });

        // Calculate total monthly and yearly times
        const monthlyTotalTime = Object.values(monthly).reduce((sum, time) => sum + time, 0);
        const yearlyTotalTime = Object.values(yearly).reduce((sum, time) => sum + time, 0);

        // Calculate percentages for monthly and yearly data
        const monthlyPercentages = {};
        const yearlyPercentages = {};

        if (monthlyTotalTime > 0) {
            for (const [type, totalTime] of Object.entries(monthly)) {
                monthlyPercentages[type] = ((totalTime / monthlyTotalTime) * 100).toFixed(2);
            }
        }

        if (yearlyTotalTime > 0) {
            for (const [type, totalTime] of Object.entries(yearly)) {
                yearlyPercentages[type] = ((totalTime / yearlyTotalTime) * 100).toFixed(2);
            }
        }

        // Create the result array
        const allEarningTypes = new Set([...Object.keys(monthly), ...Object.keys(yearly)]);
        return Array.from(allEarningTypes).map((type) => ({
            earningType: type,
            monthPercentage: monthlyPercentages[type] || "0.00",
            monthHours: monthly[type] || 0,
            yearPercentage: yearlyPercentages[type] || "0.00",
            yearHours: yearly[type] || 0, // Corrected to store actual hours
        }));
    };
    
    const earningTypePercentages = calculateEarningTypePercentages();

    return (
        <div className="sidebar">
            <h2>{editEntry ? "Edit Time Entry" : "Add Time Entry"}</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleFormSubmit}>
                <div className="mb-3">
                    <label className="form-label">Project Code</label>
                    <input
                        type="text"
                        name="projectCode"
                        className={`form-control ${!focusedField && projectCodeInvalid ? 'is-invalid' : ''}`}
                        value={formData.projectCode}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onFocus={handleInputFocus}
                        ref={projectCodeRef}
                        required
                        autoComplete="off"
                    />
                    {!focusedField && projectCodeInvalid &&
                        <div className="invalid-feedback">Invalid project.</div>}
                    {focusedField === 'projectCode' && filteredProjectCodes.length > 0 && (
                        <ul className="list-group">
                            {filteredProjectCodes.map((code) => (
                                <li key={code} className="list-group-item"
                                    onClick={() => handleInputChange({target: {name: 'projectCode', value: code}})}>
                                    {code}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mb-3">
                    <label className="form-label">Project Task</label>
                    <input
                        type="text"
                        name="projectTask"
                        className={`form-control ${!focusedField && !tasksLoading && projectTaskInvalid ? 'is-invalid' : ''}`}
                        value={formData.projectTask}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onFocus={handleInputFocus}
                        required
                        autoComplete="off"
                        disabled={!formData.projectCode}
                    />
                    {!focusedField && !tasksLoading && projectTaskInvalid &&
                        <div className="invalid-feedback">Invalid project task.</div>}
                    {focusedField === 'projectTask' && filteredProjectTasks.length > 0 && (
                        <ul className="list-group">
                            {filteredProjectTasks.map((task) => (
                                <li key={task.id} className="list-group-item" onClick={() => handleInputChange({
                                    target: {
                                        name: 'projectTask',
                                        value: task.task
                                    }
                                })}>
                                    {task.task}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mb-3">
                    <label className="form-label">Earning Type</label>
                    <input
                        type="text"
                        name="earningType"
                        className={`form-control ${!focusedField && earningTypeInvalid ? 'is-invalid' : ''}`}
                        value={formData.earningType}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onFocus={handleInputFocus}
                        required
                        autoComplete="off"
                    />
                    {!focusedField && earningTypeInvalid &&
                        <div className="invalid-feedback">Invalid earning type.</div>}
                    {focusedField === 'earningType' && filteredEarningTypes.length > 0 && (
                        <ul className="list-group">
                            {filteredEarningTypes.map((type) => (
                                <li key={type} className="list-group-item"
                                    onClick={() => handleInputChange({target: {name: 'earningType', value: type}})}>
                                    {type}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input type="date" name="date" className="form-control" value={formData.date}
                           onChange={handleInputChange} ref={dateInputRef} required/>
                </div>
                <div className="mb-3">
                    <label className="form-label">Time Spent (hours)</label>
                    <input type="number" name="timeSpent" className="form-control" value={formData.timeSpent}
                           onChange={handleInputChange} required/>
                </div>
                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea name="description" className="form-control" value={formData.description}
                              onChange={handleInputChange} required/>
                </div>
                <button type="submit" className="btn btn-primary">{editEntry ? "Update Entry" : "Add Entry"}</button>
                {editEntry && (
                    <button type="button" onClick={deleteExistingEntry} className="btn btn-danger">Delete Entry</button>
                )}
                {editEntry && (
                    <button type="button" className="btn btn-light" onClick={handleEditCancel}>Cancel Edit</button>
                )}
            </form>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal show" style={{display: 'block'}} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title dark">Export Time Entries</h5>
                                    <button type="button" className="btn-close"
                                            onClick={() => setIsModalOpen(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <label className="form-label dark">Start Date</label>
                                    <input type="date" className="form-control" value={startDate}
                                           onChange={(e) => setStartDate(e.target.value)} required/>
                                    <label className="form-label dark">End Date</label>
                                    <input type="date" className="form-control" value={endDate}
                                           onChange={(e) => setEndDate(e.target.value)} required/>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary"
                                            onClick={() => setIsModalOpen(false)}
                                    >
                                        Close
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={generateCSV}>
                                        Export
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="summary">
                <h3>Summary</h3>
                <div className="month-selection mb-3">
                    <select className="form-select" value={selectedMonth} onChange={handleMonthChange}>
                        {months.map((month, index) => (
                            <option key={index} value={index}>
                                {month}
                            </option>
                        ))}
                    </select>
                </div>
                <p>
                    Entered Hours: {currentlyEnteredHours} / {totalWorkingHours}
                </p>
            </div>

            <div className="table-container">
                <table className="table summary-table">
                    <thead>
                    <tr>
                        <th className="tooltip-cell">
                            ET
                            <span className="tooltip-text">Earning Type</span>
                        </th>
                        <th>Monthly %</th>
                        <th>Yearly %</th>
                    </tr>
                    </thead>
                    <tbody>
                    {earningTypePercentages.map((entry) => (
                        <tr key={entry.earningType}>
                            <td>{entry.earningType}</td>
                            <td className="tooltip-cell">
                                {entry.monthPercentage}%
                                <span className="tooltip-text">{entry.monthHours} hours</span>
                            </td>
                            <td className="tooltip-cell">
                                {entry.yearPercentage}%
                                <span className="tooltip-text">{entry.yearHours} hours</span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between">
                <div className="btn-group" role="group" aria-label="Sidebar actions">

                    <button type="button" className="btn btn-success tooltip-cell" onClick={() => window.location.reload()}>
                        <i className="bi bi-arrow-clockwise"></i>
                        <span className="tooltip-text">Reload Page</span>
                    </button>
                    <button type="button" className="btn btn-secondary tooltip-cell" onClick={toggleSettings}>
                        <i className="bi bi-gear-fill"></i>
                        <span className="tooltip-text">Settings</span>
                    </button>
                    <button type="button" className="btn btn-info tooltip-cell" onClick={exportToCSV}>
                        <i className="bi bi-download"></i>
                        <span className="tooltip-text">Export CSV</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;