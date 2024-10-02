import { openDB } from 'idb';

const DB_NAME = 'mwaTimeEntryDB';
const DB_VERSION = 1;
const STORE_NAMES = {
    PROJECT_CODES: 'project-codes',
    PROJECT_TASKS: 'project-tasks',
    TIME_ENTRIES: 'time-entries'
};

const initializeDB = async () => {
    return await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            db.createObjectStore(STORE_NAMES.PROJECT_CODES, { keyPath: 'id' });
            db.createObjectStore(STORE_NAMES.PROJECT_TASKS, { keyPath: 'id' });
            db.createObjectStore(STORE_NAMES.TIME_ENTRIES, { keyPath: 'id' });
        }
    });
};

// Import/Export Data
export const importData = async (data) => {
    const db = await initializeDB();
    const tx = db.transaction([STORE_NAMES.PROJECT_CODES, STORE_NAMES.PROJECT_TASKS, STORE_NAMES.TIME_ENTRIES], 'readwrite');

    await Promise.all([
        data.projectCodes.map(code => tx.objectStore(STORE_NAMES.PROJECT_CODES).put(code)),
        data.projectTasks.map(task => tx.objectStore(STORE_NAMES.PROJECT_TASKS).put(task)),
        data.timeEntries.map(entry => tx.objectStore(STORE_NAMES.TIME_ENTRIES).put(entry)),
    ]);

    await tx.done;
    console.log('Data imported successfully');
};

export const exportData = async () => {
    const db = await initializeDB();
    const tx = db.transaction([STORE_NAMES.PROJECT_CODES, STORE_NAMES.PROJECT_TASKS, STORE_NAMES.TIME_ENTRIES], 'readonly');
    const projectCodes = await tx.objectStore(STORE_NAMES.PROJECT_CODES).getAll();
    const projectTasks = await tx.objectStore(STORE_NAMES.PROJECT_TASKS).getAll();
    const timeEntries = await tx.objectStore(STORE_NAMES.TIME_ENTRIES).getAll();
    return { projectCodes, projectTasks, timeEntries };
};

// Time Entry Operations
export const addTimeEntry = async (timeEntry) => {
    const db = await initializeDB();
    await db.put(STORE_NAMES.TIME_ENTRIES, timeEntry);
};

export const getTimeEntries = async () => {
    const db = await initializeDB();
    return await db.getAll(STORE_NAMES.TIME_ENTRIES);
};

export const updateTimeEntry = async (timeEntry) => {
    const db = await initializeDB();
    await db.put(STORE_NAMES.TIME_ENTRIES, timeEntry);
};

export const deleteTimeEntry = async (id) => {
    const db = await initializeDB();
    await db.delete(STORE_NAMES.TIME_ENTRIES, id);
};

// Project Code Operations
export const addProjectCode = async (projectCode) => {
    const db = await initializeDB();
    await db.put(STORE_NAMES.PROJECT_CODES, projectCode);
};

export const getProjectCodes = async () => {
    const db = await initializeDB();
    return await db.getAll(STORE_NAMES.PROJECT_CODES);
};

// Project Task Operations
export const addProjectTask = async (projectTask) => {
    const db = await initializeDB();
    await db.put(STORE_NAMES.PROJECT_TASKS, projectTask);
};

export const getProjectTasksByCode = async (projectCode) => {
    const projectCodes = await getProjectCodes();
    const projectCodeObj = projectCodes.find(pc => pc.code === projectCode);
    if (!projectCodeObj) {
        console.error("No project found with code:", projectCode);
        return [];
    }
    const { id: projectCodeId } = projectCodeObj;
    const db = await initializeDB();
    const tasks = await db.getAll(STORE_NAMES.PROJECT_TASKS);
    return tasks.filter(task => task.projectCodeId === projectCodeId);
};

export const getProjectTasksByCodeId = async (projectCodeId) => {
    const db = await initializeDB();
    const tasks = await db.getAll(STORE_NAMES.PROJECT_TASKS);
    return tasks.filter(task => task.projectCodeId === projectCodeId);
}
export const getAllProjectTasks = async () => {
    const db = await initializeDB();
    return await db.getAll(STORE_NAMES.PROJECT_TASKS);
};

export const deleteProjectTask = async (id) => {
    const db = await initializeDB();
    await db.delete(STORE_NAMES.PROJECT_TASKS, id);
};

// File Operations
export const exportDataToFile = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'time-entries-export.json';
    a.click();
    URL.revokeObjectURL(url);
};

export const importDataFromFile = async (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
        const data = JSON.parse(event.target.result);
        await importData(data);
    };
    reader.readAsText(file);
};