const nodemailer = require('nodemailer');
const Reminder = require('../models/Reminder');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendDueReminders() {
  try {
    const today = new Date();
    const in3days = new Date(); in3days.setDate(today.getDate() + 3);

    // Find reminders due in next 3 days that haven't had emails sent
    const reminders = await Reminder.find({
      status: { $in: ['Pending', 'Overdue'] },
      dueDate: { $lte: in3days },
      emailSent: false
    }).populate('user').populate('device');

    for (const reminder of reminders) {
      if (!reminder.user?.email) continue;

      const dueDate = new Date(reminder.dueDate).toDateString();
      const isOverdue = reminder.status === 'Overdue';

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: reminder.user.email,
        subject: `${isOverdue ? '🚨 OVERDUE' : '⏰ Due Soon'}: ${reminder.title} – ElectroMaintain`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0a0e1a;color:#e2e8f0;border-radius:12px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#00e5ff22,#a78bfa22);padding:32px;border-bottom:1px solid #1e2d45">
              <h1 style="margin:0;font-size:24px;color:#00e5ff">⚡ ElectroMaintain</h1>
              <p style="margin:8px 0 0;color:#64748b;font-size:14px">Maintenance Reminder Alert</p>
            </div>
            <div style="padding:32px">
              <div style="background:${isOverdue ? '#ef444422' : '#f59e0b22'};border:1px solid ${isOverdue ? '#ef4444' : '#f59e0b'};border-radius:8px;padding:16px;margin-bottom:24px">
                <p style="margin:0;font-size:13px;font-weight:700;color:${isOverdue ? '#ef4444' : '#f59e0b'};text-transform:uppercase;letter-spacing:1px">${isOverdue ? '🚨 OVERDUE' : '⏰ DUE SOON'}</p>
              </div>
              <h2 style="margin:0 0 8px;font-size:20px">${reminder.title}</h2>
              <p style="color:#64748b;margin:0 0 24px">Device: <strong style="color:#e2e8f0">${reminder.device?.name} (${reminder.device?.brand} ${reminder.device?.model})</strong></p>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;border-bottom:1px solid #1e2d45;color:#64748b;font-size:14px">Due Date</td><td style="padding:8px 0;border-bottom:1px solid #1e2d45;font-size:14px">${dueDate}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #1e2d45;color:#64748b;font-size:14px">Priority</td><td style="padding:8px 0;border-bottom:1px solid #1e2d45;font-size:14px">${reminder.priority}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;font-size:14px">Task Type</td><td style="padding:8px 0;font-size:14px">${reminder.taskType}</td></tr>
              </table>
              ${reminder.mlPredictedDate ? `
              <div style="background:#00e5ff11;border:1px solid #00e5ff33;border-radius:8px;padding:16px;margin-top:24px">
                <p style="margin:0;font-size:12px;color:#00e5ff;font-weight:700;text-transform:uppercase;letter-spacing:1px">🤖 ML Prediction</p>
                <p style="margin:8px 0 0;font-size:14px">Next predicted maintenance: <strong>${new Date(reminder.mlPredictedDate).toDateString()}</strong></p>
              </div>` : ''}
            </div>
            <div style="padding:24px 32px;border-top:1px solid #1e2d45;text-align:center;color:#64748b;font-size:12px">
              ElectroMaintain — Smart Maintenance Scheduler &nbsp;|&nbsp; PBL Project
            </div>
          </div>
        `
      });

      reminder.emailSent = true;
      await reminder.save();
      console.log(`📧 Email sent to ${reminder.user.email} for: ${reminder.title}`);
    }
  } catch (err) {
    console.error('Email cron error:', err.message);
  }
}

module.exports = { sendDueReminders };
