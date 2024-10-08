import React, { useState } from "react";

const groupEntriesByDay = (entries) => {
  return entries.reduce((acc, entry) => {
    const date = new Date(entry.date + "T00:00:00").toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {});
};

const TimeEntries = ({ entries, setEditEntry, copyEntry, dateInputRef }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekRange = (offset) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const endOfWeek = new Date(now);

    // Start of the week on Sunday
    startOfWeek.setDate(now.getDate() - now.getDay() + offset * 7); // Sunday
    endOfWeek.setDate(now.getDate() - now.getDay() + 6 + offset * 7); // Saturday

    startOfWeek.setHours(0, 0, 0, 0);
    endOfWeek.setHours(23, 59, 59, 999); // Include all of Saturday

    return { startOfWeek, endOfWeek };
  };

  const { startOfWeek, endOfWeek } = getWeekRange(weekOffset);
  const currentWeekEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date + "T00:00:00");
    return entryDate >= startOfWeek && entryDate <= endOfWeek; // Include Saturdays
  });

  const entriesByDay = groupEntriesByDay(currentWeekEntries);

  const getTotalHoursForDay = (dayEntries) => {
    return dayEntries.reduce((total, entry) => total + parseFloat(entry.timeSpent), 0);
  };

  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);

  const handleEditEntry = (entry) => {
    setEditEntry(entry);
  };

  return (
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mt-4">
          <button className="btn btn-secondary" onClick={goToPreviousWeek}>
            ← Previous Week
          </button>
          <h2>
            Time Entries ({startOfWeek.toLocaleDateString('en-US')} - {endOfWeek.toLocaleDateString('en-US')})
          </h2>
          <button className="btn btn-secondary" onClick={goToNextWeek}>
            Next Week →
          </button>
        </div>

        {currentWeekEntries.length === 0 ? (
            <p>No entries for this week.</p>
        ) : (
            <table className="table mt-3 no-padding-spacing-table">
              <thead>
              <tr>
                <th scope="col" className="tooltip-cell">
                  Project
                  <span className="tooltip-text">Project Code</span>
                </th>
                <th scope="col" className="tooltip-cell">
                  Task
                  <span className="tooltip-text">Project Task</span>
                </th>
                <th scope="col" className="tooltip-cell">
                  ET
                  <span className="tooltip-text">Earning Type</span>
                </th>
                <th scope="col">Date</th>
                <th scope="col">Time Spent</th>
                <th scope="col">Description</th>
                {/*<th scope="col">Action</th>*/}
              </tr>
              </thead>
              <tbody>
              {Object.keys(entriesByDay)
                  .sort((a, b) => new Date(a) - new Date(b)) // Sort by date ascending
                  .map((day, index) => {
                    const dayEntries = entriesByDay[day];
                    const totalHours = getTotalHoursForDay(dayEntries);
                    const dateObj = new Date(dayEntries[0].date + "T00:00:00");
                    const dayOfWeek = dateObj
                        .toLocaleDateString('en-US', { weekday: 'long' })
                        .toUpperCase();

                    // Format day to MM/DD/YYYY
                    const formattedDate = dateObj.toLocaleDateString('en-US');

                    return (
                        <React.Fragment key={index}>
                          {dayEntries.map((entry) => (
                              <tr key={entry.id}>
                                <td>{entry.projectCode}</td>
                                <td>{entry.projectTask}</td>
                                <td>{entry.earningType}</td>
                                <td>{new Date(entry.date + "T00:00:00").toLocaleDateString('en-US')}</td>
                                <td>{entry.timeSpent} hrs</td>
                                <td>{entry.description}</td>
                                <td>
                                  <button
                                      className="btn btn-warning btn-sm"
                                      onClick={() => handleEditEntry(entry)}
                                  >
                                    Edit
                                  </button>
                                  {/* <button 
                            className="btn btn-info btn-sm ml-2"
                            onClick={() => copyEntry(entry)} // Call the copyEntry prop
                          >
                            Copy
                          </button> */}
                                </td>
                              </tr>
                          ))}
                          <tr>
                            <td colSpan="7" className="text-center summary-row">
                              {dayOfWeek}, {formattedDate}: {totalHours.toFixed(2)} total hours
                            </td>
                          </tr>
                        </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
        )}
      </div>
  );
};

export default TimeEntries;