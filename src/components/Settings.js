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

const Settings = ({
    settingsData,
    saveSettings,
    closeSettings,
    user,
    onSignIn,
    onSignUp,
    onSignOut,
    authMode = false
}) => {
    console.log('Settings Component Props:', {
        user,
        authMode,
        hasUser: !!user,
        userId: user?.userId,
        userName: user?.name
    });

    const [userValue, setUserValue] = useState(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [authError, setAuthError] = useState('');

    const [projectCodes, setProjectCodes] = useState([]);
    const [newProjectCode, setNewProjectCode] = useState('');
    const [selectedProjectCode, setSelectedProjectCode] = useState('');
    const [newProjectTask, setNewProjectTask] = useState('');
    const [tasksForSelectedProject, setTasksForSelectedProject] = useState([]);
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [importMessage, setImportMessage] = useState('');

    console.log('Settings rendered with:', { userValue, authMode });

    useEffect(() => {
        const subscription = user.subscribe((value) => {
            setUserValue(value);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    useEffect(() => {
        if (userValue && !authMode) {
            loadProjectCodes();
        }
    }, [userValue, authMode]);

    const loadProjectCodes = async () => {
        try {
            const codes = await getProjectCodes();
            setProjectCodes(codes);
        } catch (error) {
            console.error('Error loading project codes:', error);
        }
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        
        try {
            if (isSigningUp) {
                await onSignUp(email, password);
            } else {
                await onSignIn(email, password);
            }
            setEmail('');
            setPassword('');
        } catch (error) {
            setAuthError(error.message);
        }
    };

    const handleAddProjectCode = async () => {
        if (newProjectCode.trim() === '') return;

        const newCode = {
            code: newProjectCode,
            modifiedAt: new Date().toISOString()
        };
        
        try {
            const id = await addProjectCode(newCode);
            const addedCode = { ...newCode, id };
            setProjectCodes([...projectCodes, addedCode]);
            setNewProjectCode('');
        } catch (error) {
            console.error('Error adding project code:', error);
        }
    };

    const handleSelectProjectCode = async (e) => {
        const codeId = e.target.value;
        setSelectedProjectCode(codeId);
        
        if (codeId) {
            try {
                const tasks = await getProjectTasksByCodeId(codeId);
                setTasksForSelectedProject(tasks);
            } catch (error) {
                console.error('Error loading tasks:', error);
                setTasksForSelectedProject([]);
            }
        } else {
            setTasksForSelectedProject([]);
        }
    };

    const handleAddProjectTask = async () => {
        if (selectedProjectCode && newProjectTask.trim() !== '') {
            const newTask = {
                projectCodeId: selectedProjectCode,
                task: newProjectTask,
                modifiedAt: new Date().toISOString()
            };

            try {
                const id = await addProjectTask(newTask);
                const addedTask = { ...newTask, id };
                setTasksForSelectedProject([...tasksForSelectedProject, addedTask]);
                setNewProjectTask('');
            } catch (error) {
                console.error('Error adding project task:', error);
            }
        }
    };

    const handleExportData = async () => {
        try {
            await exportDataToFile();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    };

    const handleImportDataClick = async () => {
        if (!selectedFile) {
            setImportMessage('Please select a file first');
            return;
        }

        try {
            await importDataFromFile(selectedFile);
            const updatedEntries = await getTimeEntries();
            console.log('Imported Entries:', updatedEntries);
            setImportMessage('File imported successfully');
            setSelectedFile(null);
            
            await loadProjectCodes();
            setTimeout(() => setImportMessage(''), 3000);
        } catch (error) {
            setImportMessage('Import failed: ' + error.message);
            setTimeout(() => setImportMessage(''), 5000);
        }
    };

    if (!userValue || userValue.userId === "unauthorized" || userValue.name === "Unauthorized") {
        return (
            <div className="auth-container p-4 border rounded shadow-sm">
                <h2 className="text-center mb-4">{isSigningUp ? 'Create Account' : 'Sign In'}</h2>
                {authError && (
                    <div className="alert alert-danger" role="alert">
                        {authError}
                    </div>
                )}
                
                <form onSubmit={handleAuthSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    
                    <div className="d-grid gap-2">
                        <button type="submit" className="btn btn-primary">
                            {isSigningUp ? 'Sign Up' : 'Sign In'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-link"
                            onClick={() => setIsSigningUp(!isSigningUp)}
                        >
                            {isSigningUp 
                                ? 'Already have an account? Sign in' 
                                : 'Need an account? Sign up'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="settings">
            <h2>Settings</h2>
            <div className="settings-container d-flex">
                <div className="settings-left-column">
                    <div className="mb-3">
                        <h3>Project Codes</h3>
                        <div className="input-group">
                            <input
                                type="text"
                                value={newProjectCode}
                                onChange={(e) => setNewProjectCode(e.target.value)}
                                placeholder="New Project Code"
                                className="form-control"
                            />
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={handleAddProjectCode}
                            >
                                Add Project Code
                            </button>
                        </div>
                    </div>

                    <div className="mb-3">
                        <h3>Project Tasks</h3>
                        <select 
                            className="form-select mb-2" 
                            value={selectedProjectCode} 
                            onChange={handleSelectProjectCode}
                        >
                            <option value="">Select Project Code</option>
                            {projectCodes.map((code) => (
                                <option key={code.id} value={code.id}>
                                    {code.code}
                                </option>
                            ))}
                        </select>

                        {selectedProjectCode && (
                            <div>
                                <div className="input-group mb-2">
                                    <input
                                        type="text"
                                        value={newProjectTask}
                                        onChange={(e) => setNewProjectTask(e.target.value)}
                                        placeholder="New Project Task"
                                        className="form-control"
                                    />
                                    <button 
                                        type="button" 
                                        className="btn btn-primary"
                                        onClick={handleAddProjectTask}
                                    >
                                        Add Task
                                    </button>
                                </div>

                                <ul className="list-group">
                                    {tasksForSelectedProject.map((task) => (
                                        <li key={task.id} className="list-group-item">
                                            {task.task}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="mb-3 d-flex gap-2">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={closeSettings}
                        >
                            Close Settings
                        </button>
                        {userValue && userValue.userId !== "unauthorized" && userValue.name !== "Unauthorized" && (
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={onSignOut}
                            >
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>

                <div className="settings-right-column">
                    <h3>Data Management</h3>
                    <div className="d-flex flex-column gap-2">
                        <button
                            type="button"
                            className="btn btn-secondary"
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
                            className="btn btn-secondary"
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

                        {importMessage && (
                            <div className={`alert ${
                                importMessage.includes('failed') 
                                    ? 'alert-danger' 
                                    : 'alert-success'
                            }`}>
                                {importMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;