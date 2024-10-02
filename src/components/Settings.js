import React, { useState, useEffect } from 'react';
import {
    getProjectCodes,
    addProjectCode,
    addProjectTask,
    getProjectTasksByCodeId,
    getTimeEntries,
    exportDataToFile,
    importDataFromFile
} from '../services/idbService';

const Settings = ({ settingsData, saveSettings, closeSettings }) => {
    const [formData] = useState({
        // Initialize with your default settings or props
        setting1: settingsData.setting1 || '',
        setting2: settingsData.setting2 || '',
        // Add additional settings as needed
    });

    const [projectCodes, setProjectCodes] = useState([]);
    const [newProjectCode, setNewProjectCode] = useState('');
    const [selectedProjectCode, setSelectedProjectCode] = useState('');
    const [newProjectTask, setNewProjectTask] = useState('');
    const [tasksForSelectedProject, setTasksForSelectedProject] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [importMessage, setImportMessage] = useState('');

    useEffect(() => {
        // Load all project codes on component mount
        async function loadProjectCodes() {
            const codes = await getProjectCodes();
            setProjectCodes(codes);
        }
        loadProjectCodes();
    }, []);

    const handleAddProjectCode = async () => {
        if (newProjectCode.trim() === '') return;

        const newCode = { id: new Date().getTime(), code: newProjectCode };
        await addProjectCode(newCode);

        setProjectCodes([...projectCodes, newCode]);
        setNewProjectCode('');
    };

    const handleSelectProjectCode = async (e) => {
        const codeId = e.target.value;
        setSelectedProjectCode(codeId);
        const tasks = await getProjectTasksByCodeId(parseInt(codeId));
        setTasksForSelectedProject(tasks);
    };

    const handleAddProjectTask = async () => {
        if (selectedProjectCode && newProjectTask.trim() !== '') {
            const newTask = {
                id: new Date().getTime(),
                projectCodeId: parseInt(selectedProjectCode),
                task: newProjectTask
            };
            await addProjectTask(newTask);

            setTasksForSelectedProject([...tasksForSelectedProject, newTask]);
            setNewProjectTask('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveSettings(formData);
        closeSettings();
    };

    const handleExportData = async () => {
        await exportDataToFile();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    const handleImportDataClick = async () => {
        if (selectedFile) {
            await importDataFromFile(selectedFile);
            const updatedEntries = await getTimeEntries();
            console.log('Imported Entries:', updatedEntries);

            // Show success message
            setImportMessage('File imported successfully');

            // Clear the selectedFile state
            setSelectedFile(null);

            // Automatically hide the message after some time (e.g., 3 seconds)
            setTimeout(() => setImportMessage(''), 3000);
        } else {
            console.warn('No file selected');
        }
    };

    return (
        <div className="settings">
            <h2>Settings</h2>
            <form onSubmit={handleSubmit} className="settings-form d-flex">
                <div className="settings-left-column">
                    {/*<div className="mb-3">*/}
                    {/*    <label className="form-label">Setting 1</label>*/}
                    {/*    <input*/}
                    {/*        type="text"*/}
                    {/*        name="setting1"*/}
                    {/*        value={formData.setting1}*/}
                    {/*        onChange={handleSettingChange}*/}
                    {/*        className="form-control"*/}
                    {/*    />*/}
                    {/*</div>*/}
                    {/*<div className="mb-3">*/}
                    {/*    <label className="form-label">Setting 2</label>*/}
                    {/*    <input*/}
                    {/*        type="text"*/}
                    {/*        name="setting2"*/}
                    {/*        value={formData.setting2}*/}
                    {/*        onChange={handleSettingChange}*/}
                    {/*        className="form-control"*/}
                    {/*    />*/}
                    {/*</div>*/}

                    {/* Project Code and Task Management */}
                    <div className="mb-3">
                        <label className="form-label">Project Codes</label>
                        <input
                            type="text"
                            value={newProjectCode}
                            onChange={(e) => setNewProjectCode(e.target.value)}
                            placeholder="New Project Code"
                            className="form-control"
                        />
                        <button type="button" className="btn btn-primary mt-2" onClick={handleAddProjectCode}>
                            Add Project Code
                        </button>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Select Project Code</label>
                        <select className="form-select" value={selectedProjectCode} onChange={handleSelectProjectCode}>
                            <option value="">Select Project Code</option>
                            {projectCodes.map((code) => (
                                <option key={code.id} value={code.id}>
                                    {code.code}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedProjectCode && (
                        <div className="mb-3">
                            <label className="form-label">
                                Project Tasks for {projectCodes.find((code) => code.id === parseInt(selectedProjectCode))?.code}
                            </label>
                            <input
                                type="text"
                                value={newProjectTask}
                                onChange={(e) => setNewProjectTask(e.target.value)}
                                placeholder="New Project Task"
                                className="form-control"
                            />
                            <button type="button" className="btn btn-primary mt-2" onClick={handleAddProjectTask}>
                                Add Project Task
                            </button>
                            <ul className="list-group mt-2">
                                {tasksForSelectedProject.map((task) => (
                                    <li key={task.id} className="list-group-item">
                                        {task.task}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" className="btn btn-secondary" onClick={closeSettings}>Cancel</button>
                </div>
                <div className="settings-right-column">
                    <div className="d-flex flex-column align-items-center">
                        <button
                            type="button"
                            className="btn btn-secondary mb-2"
                            onClick={handleExportData}
                        >
                            Export Database
                        </button>
                        <input
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            id="import-file-input"
                        />
                        <button
                            type="button"
                            className="btn btn-secondary mb-2"
                            onClick={() => document.getElementById('import-file-input').click()}
                        >
                            Select Import File
                        </button>
                        {selectedFile && (
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={handleImportDataClick}
                            >
                                Import Database
                            </button>
                        )}
                    </div>
                </div>
            </form>
            {importMessage && (
                <div className="alert alert-success mt-3" role="alert">
                    {importMessage}
                </div>
            )}
        </div>
    );
};

export default Settings;