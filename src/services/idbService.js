import Dexie from 'dexie';
import { dexieCloud } from 'dexie-cloud-addon';

// Add Dexie Cloud addon
Dexie.addons.push(dexieCloud);

class TimeEntryDatabase extends Dexie {
    constructor() {
        super('mwaTimeEntryDB', { addons: [dexieCloud] });

        // Define schema
        this.version(1).stores({
            projectCodes: 'id, code, modifiedAt',
            projectTasks: 'id, projectCodeId, task, modifiedAt',
            timeEntries: 'id, date, projectTaskId, startTime, endTime, description, modifiedAt'
        });

        this.cloud.configure({
            databaseUrl: 'https://zqewpqxhr.dexie.cloud',
            allowedOrigins: ['http://localhost:3000', 'http://localhost:5173', window.location.origin],
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': window.location.origin
            }
        });
    }
}

// Create and export database instance
const db = new TimeEntryDatabase();
export { db };

// Initialize database
export const initializeDB = async () => {
    try {
        await db.open();
        console.log('Database initialized successfully');
        return db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
};

export const signIn = async (email, password) => {
    try {
        console.log('Attempting sign in...');
        const result = await db.cloud.login({
            email,
            password
        });
        console.log('Sign in result:', result);
        return result;
    } catch (error) {
        console.error('Sign in failed:', error);
        throw error;
    }
};

export const signUp = async (email, password) => {
    try {
        const result = await db.cloud.login({
            email,
            password,
            createIfNotExists: true
        });
        return result;
    } catch (error) {
        console.error('Sign up failed:', error);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await db.cloud.logout();
    } catch (error) {
        console.error('Sign out failed:', error);
        throw error;
    }
};

export const checkCurrentUser = async () => {
    const user = await db.cloud.currentUser;
    console.log('Current user check:', user);
    return user;
};

// Project Code Operations
export const addProjectCode = async (projectCode) => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        return await db.projectCodes.add({
            ...projectCode,
            modifiedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error adding project code:', error);
        throw error;
    }
};

export const getProjectCodes = async () => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) return [];

        return await db.projectCodes.toArray();
    } catch (error) {
        console.error('Error getting project codes:', error);
        return [];
    }
};

// Project Task Operations
export const addProjectTask = async (projectTask) => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        return await db.projectTasks.add({
            ...projectTask,
            modifiedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error adding project task:', error);
        throw error;
    }
};

export const getProjectTasksByCodeId = async (projectCodeId) => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) return [];

        return await db.projectTasks
            .where('projectCodeId')
            .equals(projectCodeId)
            .toArray();
    } catch (error) {
        console.error('Error getting project tasks:', error);
        return [];
    }
};

export const getAllProjectTasks = async () => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) return [];

        return await db.projectTasks.toArray();
    } catch (error) {
        console.error('Error getting all project tasks:', error);
        return [];
    }
};

export const deleteProjectTask = async (id) => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        return await db.projectTasks.delete(id);
    } catch (error) {
        console.error('Error deleting project task:', error);
        throw error;
    }
};

// Time Entry Operations
export const addTimeEntry = async (timeEntry) => {
    if (!db) throw new Error('Database not initialized');
    const user = db.cloud.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Remove any id field and let Dexie generate it with correct prefix
    const { id, ...entryWithoutId } = timeEntry;
    
    const entryToAdd = {
        ...entryWithoutId,
        modifiedAt: new Date().toISOString()
    };

    return await db.timeEntries.add(entryToAdd);
};

export const getTimeEntries = async () => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) return [];

        return await db.timeEntries.toArray();
    } catch (error) {
        console.error('Error getting time entries:', error);
        return [];
    }
};

export const updateTimeEntry = async (timeEntry) => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        return await db.timeEntries.put({
            ...timeEntry,
            modifiedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating time entry:', error);
        throw error;
    }
};

export const deleteTimeEntry = async (id) => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        return await db.timeEntries.delete(id);
    } catch (error) {
        console.error('Error deleting time entry:', error);
        throw error;
    }
};

// Import/Export Operations
export const exportData = async () => {
    try {
        const currentUser = await db.cloud.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        return {
            projectCodes: await getProjectCodes(),
            projectTasks: await getAllProjectTasks(),
            timeEntries: await getTimeEntries()
        };
    } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
    }
};

export const importData = async (data) => {
    if (!db) throw new Error('Database not initialized');

    try {
        console.log('Starting import with data:', data);

        await db.transaction('rw',
            [db.projectCodes, db.projectTasks, db.timeEntries],
            async () => {
                const projectCodes = data.projectCodes.map(code => ({
                    id: String(code.id), // Ensure the ID is a string
                    code: code.code,
                    modifiedAt: new Date().toISOString()
                }));

                const projectTasks = data.projectTasks.map(task => ({
                    id: String(task.id), // Ensure the ID is a string
                    projectCodeId: String(task.projectCodeId), // Ensure IDs are strings
                    task: task.task,
                    modifiedAt: new Date().toISOString()
                }));

                const timeEntries = data.timeEntries.map(entry => ({
                    id: String(entry.id), // Ensure the ID is a string
                    date: entry.date,
                    projectCode: String(entry.projectCode), // Ensure IDs are strings
                    projectTask: String(entry.projectTask), // Ensure IDs are strings
                    earningType: entry.earningType,
                    timeSpent: entry.timeSpent,
                    description: entry.description,
                    modifiedAt: new Date().toISOString()
                }));

                // Use `bulkPut` for upserts to prevent duplicates
                await Promise.all([
                    db.projectCodes.bulkPut(projectCodes),
                    db.projectTasks.bulkPut(projectTasks),
                    db.timeEntries.bulkPut(timeEntries)
                ]);
            }
        );

        console.log('Import completed successfully');
    } catch (error) {
        console.error('Import error:', error);
        throw error;
    }
};




export const exportDataToFile = async () => {
    try {
        const data = await exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'time-entries-export.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting data to file:', error);
        throw error;
    }
};

export const importDataFromFile = async (file) => {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Validate data structure
        if (!data.projectCodes || !data.projectTasks || !data.timeEntries) {
            throw new Error('Invalid data structure');
        }

        await importData(data);
    } catch (error) {
        console.error('Import from file error:', error);
        throw new Error(`Failed to import data: ${error.message}`);
    }
};