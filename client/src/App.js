import React, { useState, useEffect } from 'react';
import './App.css';
import Axios from 'axios';
import StudentList from './StudentList';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [name, setName] = useState('');
  const [rollnumber, setRollnumber] = useState(0);
  const [studentList, setStudentList] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    Axios.get('http://localhost:3031/read')
      .then((response) => {
        setStudentList(response.data);
      })
      .catch((error) => {
        console.error('Error fetching student list:', error);
      });
  }, []);

  const addToList = () => {
    Axios.post('http://localhost:3031/insert', { name: name, rollnumber: rollnumber })
      .then((response) => {
        toast.success('Student added successfully');
        // Update the student list with the new student
        setStudentList((prevList) => [...prevList, response.data]);
        // Reset the form inputs
        setName('');
        setRollnumber(0);
      })
      .catch((error) => {
        if (error.response && error.response.status === 400) {
          toast.error('Roll number already assigned');
        } else {
          console.error('Error adding student:', error);
          toast.error('An error occurred while adding the student');
        }
      });
  };

  const handleAttendanceChange = (studentId, attendance) => {
    setAttendanceData((prevData) => ({
      ...prevData,
      [studentId]: attendance,
    }));
  };

  const handleUpdateAttendance = () => {
    const attendanceArray = Object.entries(attendanceData).map(([studentId, attendance]) => ({
      studentId,
      attendance,
    }));

    Axios.post('http://localhost:3031/attendance', { attendanceData: attendanceArray })
      .then(() => {
        console.log('Attendance recorded successfully');
      })
      .catch((error) => {
        console.error('Error recording attendance:', error);
      });
  };

  const handleDownloadAttendance = () => {
    Axios.get('http://localhost:3031/download', {
      params: { start: startDate, end: endDate },
      responseType: 'blob',
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'attendance.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((error) => {
        console.error('Error downloading attendance data:', error);
      });
  };

  return (
    <div className="App">
    <h1 className="Title">Basic Attendance Management Application</h1>
    
    <div className="FormContainer">
      <div className="StudentForm">
        <label htmlFor="name">Name :</label>
        <input 
          type="text" 
          id="name"
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
        
        <label htmlFor="rollnumber">Roll Number :</label>
        <input 
          type="number" 
          id="rollnumber"
          value={rollnumber} 
          onChange={(e) => setRollnumber(Number(e.target.value))} 
        />
        
        <button onClick={addToList}>Add to List</button>
      </div>

      <div className="DateForm">
        <label htmlFor="startDate">Start Date :</label>
        <input 
          type="date" 
          id="startDate"
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)} 
        />
        
        <label htmlFor="endDate">End Date :</label>
        <input 
          type="date" 
          id="endDate"
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)} 
        />
      </div>
    </div>

    <StudentList
      studentList={studentList}
      attendanceData={attendanceData}
      handleAttendanceChange={handleAttendanceChange}
    />
    
    <div className="ButtonContainer">
      <button className="UpdateButton" onClick={handleUpdateAttendance}>
        Update
      </button>
      <button className="DownloadButton" onClick={handleDownloadAttendance}>
        Download Attendance
      </button>
    </div>
    
    <ToastContainer />
  </div>
  );
}

export default App;
