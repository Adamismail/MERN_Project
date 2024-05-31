const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const cors = require('cors');
const app = express();
const StudentModel = require('./models/Student');
const AttendanceModel = require('./models/Attendance2'); // Ensure this path is correct

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.post('/insert', async (req, res) => {
  const { name, rollnumber } = req.body;

  try {
      const existingStudent = await StudentModel.findOne({ rollNumber: rollnumber });
      
      if (existingStudent) {
          return res.status(400).send('Roll number already exists');
      }

      const student = new StudentModel({ name, rollNumber: rollnumber });
      await student.save();
      res.send('Inserted data');
      
  } catch (err) {
      console.log(err);
      res.status(500).send('Server error');
  }
});

app.delete('/delete', async (req, res) => {
  const rollnumber = req.body.rollNumber;
  console.log(`Received rollNumber: ${rollnumber}`);

  try {
    const existingStudents = await StudentModel.find({ rollNumber: rollnumber });
    
    if (existingStudents.length === 0) {
      console.log('Students not found');
      return res.status(404).send('Students not found');
    }

    const deleteResult = await StudentModel.deleteMany({ rollNumber: rollnumber });

    if (deleteResult.deletedCount === 0) {
      console.log('Failed to delete students');
      return res.status(500).send('Failed to delete students');
    }

    console.log('Deleted data');
    res.send(`Deleted ${deleteResult.deletedCount} records`);
    
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

app.post('/attendance', (req, res) => {
  const attendanceData = req.body.attendanceData;

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString();
  const date = moment(formattedDate, 'D/M/YYYY').toDate();

  const attendanceRecords = attendanceData.map(data => ({
    studentId: data.studentId,
    attendance: data.attendance
  }));

  AttendanceModel.findOneAndUpdate(
    { date },
    { $set: { attendanceRecords } },
    { upsert: true, new: true }
  )
    .then(() => {
      res.status(200).send('Attendance recorded successfully');
    })
    .catch(error => {
      console.error('Error recording attendance:', error);
      res.status(500).send('Error recording attendance');
    });
});

app.get('/download', (req, res) => {
  const { start, end } = req.query;

  // Check if start and end dates are provided
  if (!start || !end) {
    return res.status(400).send('Start date and end date are required');
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  // Check if the provided dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).send('Invalid date format');
  }

  // Find the attendance records within the date range
  AttendanceModel.find({ date: { $gte: startDate, $lte: endDate } })
    .populate('attendanceRecords.studentId')
    .then(attendanceRecords => {
      console.log(attendanceRecords);
      if (attendanceRecords.length === 0) {
        return res.status(404).send('Attendance data not found');
      }

      const uniqueDates = [...new Set(attendanceRecords.map(record => record.date.toISOString().split('T')[0]))];
      const studentNames = [...new Set(attendanceRecords.flatMap(record => record.attendanceRecords.map(r => r.studentId.name)))];

      const csvData = studentNames.map(name => {
        const rowData = { Name: name };

        uniqueDates.forEach(date => {
          const attendanceRecord = attendanceRecords.find(record => record.date.toISOString().split('T')[0] === date);
          const attendance = attendanceRecord ? attendanceRecord.attendanceRecords.find(r => r.studentId.name === name) : null;
          rowData[date] = attendance ? attendance.attendance : '';
        });

        return rowData;
      });

      const csvHeader = [
        { id: 'Name', title: 'Name' },
        ...uniqueDates.map(date => ({ id: date, title: date }))
      ];

      const csvWriter = createCsvWriter({
        path: 'attendance.csv',
        header: csvHeader
      });

      csvWriter
        .writeRecords(csvData)
        .then(() => {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');

          const readStream = fs.createReadStream('attendance.csv');
          readStream.on('error', error => {
            console.error('Error reading CSV file:', error);
            res.status(500).send('Error reading CSV file');
          });

          readStream.pipe(res);
        })
        .catch(error => {
          console.error('Error writing CSV file:', error);
          res.status(500).send('Error generating attendance CSV');
        });
    })
    .catch(error => {
      console.error('Error downloading attendance data:', error);
      res.status(500).send('Error downloading attendance data');
    });
});


app.get('/read', async (req, res) => {
    try {
        const data = await StudentModel.find({});
        res.send(data);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
});

app.listen(3031, () => {
    console.log('Server running on port 3031');
});
