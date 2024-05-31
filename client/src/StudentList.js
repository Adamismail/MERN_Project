import React, { useState } from 'react';
import './StudentList.css';
import SearchComponent from './SearchComponent';

function StudentList({ studentList, attendanceData, handleAttendanceChange }) {
  const [searchResults, setSearchResults] = useState(studentList);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  const handleSearch = (results) => {
    setSearchResults(results);
  };

  const sortedResults = [...searchResults].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getClassNamesFor = (name) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  return (
    <div className="StudentList">
      <SearchComponent
        data={studentList}
        searchKey="name"
        setSearchResults={handleSearch}
      />

      <table>
        <thead>
          <tr>
            <th
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => requestSort('name')}
              className={getClassNamesFor('name')}
            >
              Name
            </th>
            <th
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => requestSort('rollNumber')}
              className={getClassNamesFor('rollNumber')}
            >
              Roll Number
            </th>
            <th style={{ textAlign: 'center' }}>Attendance</th>
          </tr>
        </thead>
        <tbody>
          {sortedResults.map((student) => (
            <tr key={student._id}>
              <td>{student.name}</td>
              <td>{student.rollNumber}</td>
              <td>
                <div className="attendance-container">
                  <label>
                    <input
                      type="radio"
                      name={`attendance-${student._id}`}
                      value="present"
                      checked={attendanceData[student._id] === 'present'}
                      onChange={() =>
                        handleAttendanceChange(student._id, 'present')
                      }
                    />
                    Present
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`attendance-${student._id}`}
                      value="absent"
                      checked={attendanceData[student._id] === 'absent'}
                      onChange={() =>
                        handleAttendanceChange(student._id, 'absent')
                      }
                    />
                    Absent
                  </label>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentList;
