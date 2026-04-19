export function renderAbout(container) {
  container.innerHTML = `
    <div class="anim-fadeup" style="max-width:860px;margin:0 auto">

      <!-- Hero -->
      <div style="text-align:center;padding:2rem 1rem 2.5rem">
        <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(0,229,255,.08);border:1px solid rgba(0,229,255,.2);color:var(--accent);font-family:var(--fm);font-size:.68rem;padding:4px 14px;border-radius:20px;margin-bottom:1.25rem;letter-spacing:1px">
          ⚡ PBL PROJECT — ELECTRONIC MAINTENANCE SYSTEM
        </div>
        <h1 style="margin-bottom:.85rem">
          About <span style="background:linear-gradient(90deg,var(--accent),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">ElectroMaintain</span>
        </h1>
        <p style="color:var(--muted);font-size:1rem;max-width:560px;margin:0 auto;line-height:1.8">
          A smart, full-stack web application that automatically manages your electronic device maintenance — so you never miss a critical service, update, or inspection again.
        </p>
      </div>

      <!-- Problem + Solution cards -->
      <div class="grid-2 anim-fadeup anim-d1" style="margin-bottom:2rem">
        <div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:var(--r2);padding:1.5rem">
          <div style="font-size:1.5rem;margin-bottom:.6rem">😰</div>
          <h3 style="color:var(--red);margin-bottom:.6rem">The Problem</h3>
          <p style="color:var(--muted);font-size:.88rem;line-height:1.7">
            People forget device maintenance. Laptops overheat from dusty fans. Phones lose battery health. Cars break down from skipped oil changes. AC units stop working. These failures cost time, money, and data — all because there was no reminder system.
          </p>
        </div>
        <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:var(--r2);padding:1.5rem">
          <div style="font-size:1.5rem;margin-bottom:.6rem">✅</div>
          <h3 style="color:var(--green);margin-bottom:.6rem">Our Solution</h3>
          <p style="color:var(--muted);font-size:.88rem;line-height:1.7">
            ElectroMaintain works like a smart service centre — it knows your devices, understands their maintenance needs, and automatically creates a personalised reminder schedule. Just add your device once and the system does everything else.
          </p>
        </div>
      </div>

      <!-- Project Purpose -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:1.75rem;margin-bottom:1.5rem" class="anim-fadeup anim-d1">
        <div style="font-family:var(--fm);font-size:.68rem;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:.75rem">PROJECT PURPOSE</div>
        <h2 style="margin-bottom:.85rem">Why We Built This</h2>
        <p style="color:var(--muted);line-height:1.8;font-size:.92rem">
          This project was built as part of a <strong style="color:var(--text)">Project-Based Learning (PBL)</strong> program to solve a real-world problem using technology. The goal was to build a complete, deployable web application that demonstrates modern full-stack development concepts including REST APIs, user authentication, cloud databases, automated email notifications, and machine learning.
        </p>
        <p style="color:var(--muted);line-height:1.8;font-size:.92rem;margin-top:.75rem">
          The project is inspired by how vehicle manufacturers send service reminders to car owners — we applied the same idea to <em>all</em> electronic devices a person owns.
        </p>
      </div>

      <!-- How It Works -->
      <div style="margin-bottom:1.5rem" class="anim-fadeup anim-d2">
        <div style="font-family:var(--fm);font-size:.68rem;color:var(--accent3);text-transform:uppercase;letter-spacing:1px;margin-bottom:1rem">HOW IT WORKS</div>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          ${[
            ['1','Add Your Device','Enter your device details: brand, model, purchase date, condition, and usage hours. This information feeds the intelligence engine.','var(--accent)'],
            ['2','Smart Schedule Generated','The system instantly analyses your device profile against a built-in maintenance knowledge base (like a digital device manual) and auto-creates a full reminder schedule.','var(--accent3)'],
            ['3','ML Engine Scores & Predicts','The ML engine computes a priority score (0–100) for every reminder, predicts your next maintenance date using Weighted Moving Average, and flags unusual patterns as anomalies.','var(--yellow)'],
            ['4','Email Notifications','Every morning at 8 AM, the system emails you about upcoming and overdue tasks — just like a car service centre reminds you.','var(--green)'],
            ['5','Track & Complete','Mark tasks as done. Repeating tasks automatically reschedule themselves for the next cycle. Your history improves ML predictions over time.','var(--accent2)'],
          ].map(([n, t, desc, col]) => `
            <div style="display:flex;gap:1rem;align-items:flex-start">
              <div style="width:36px;height:36px;flex-shrink:0;background:${col}22;border:1px solid ${col}44;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--fm);font-size:.8rem;font-weight:700;color:${col}">${n}</div>
              <div style="padding-top:6px">
                <div style="font-weight:700;font-size:.92rem;margin-bottom:3px">${t}</div>
                <div style="color:var(--muted);font-size:.82rem;line-height:1.6">${desc}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Benefits -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:1.75rem;margin-bottom:1.5rem" class="anim-fadeup anim-d2">
        <div style="font-family:var(--fm);font-size:.68rem;color:var(--green);text-transform:uppercase;letter-spacing:1px;margin-bottom:.75rem">BENEFITS</div>
        <h2 style="margin-bottom:1rem">Why Use ElectroMaintain?</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.85rem">
          ${[
            ['💰','Save Money','Regular maintenance prevents expensive breakdowns. A ₹200 AC filter cleaning prevents a ₹8,000 compressor failure.'],
            ['⏳','Save Time','Automated reminders mean zero mental effort. The system tracks everything so you don\'t have to.'],
            ['🔒','Protect Your Data','Regular backups and software updates protect your data from loss, ransomware, and security breaches.'],
            ['📈','Extend Device Life','Devices that are regularly maintained last 2-3x longer. Your laptop can run for 7 years instead of 3.'],
            ['🏠','All Devices, One Place','Laptop, phone, AC, car, router — manage the maintenance of everything you own in one dashboard.'],
            ['🤖','AI-Powered Intelligence','ML engine learns from your completion history to give increasingly accurate predictions and priority scores.'],
          ].map(([icon, t, d]) => `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1rem">
              <div style="font-size:1.2rem;margin-bottom:.4rem">${icon}</div>
              <div style="font-weight:700;font-size:.85rem;margin-bottom:.35rem">${t}</div>
              <div style="color:var(--muted);font-size:.78rem;line-height:1.5">${d}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- ML / AI Vision -->
      <div style="background:linear-gradient(135deg,rgba(167,139,250,.08),rgba(0,229,255,.05));border:1px solid rgba(167,139,250,.2);border-radius:var(--r2);padding:1.75rem;margin-bottom:1.5rem" class="anim-fadeup anim-d3">
        <div style="font-family:var(--fm);font-size:.68rem;color:var(--accent3);text-transform:uppercase;letter-spacing:1px;margin-bottom:.75rem">🤖 CURRENT ML ENGINE</div>
        <h2 style="margin-bottom:.85rem">What Our ML Does Today</h2>
        <p style="color:var(--muted);font-size:.88rem;line-height:1.7;margin-bottom:1rem">
          The current ML engine is built in <strong style="color:var(--text)">pure JavaScript</strong> (no Python, no TensorFlow) and runs entirely on the backend server. It uses three algorithmic approaches:
        </p>
        <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1.25rem">
          ${[
            ['📅 Weighted Moving Average','Analyses your maintenance completion history and predicts when you\'ll next need to service a device. More recent completions carry higher weight — so your prediction improves as you use the app more.'],
            ['🏆 Multi-Factor Priority Scoring','Scores every reminder from 0–100 using 7 factors: task urgency, device category risk, age, daily usage, overdue history, warranty status, and days remaining. Higher score = needs more urgent attention.'],
            ['🚨 Pattern-Based Anomaly Detection','Flags unusual patterns like 3+ overdue tasks on one device, duplicate reminders, high-usage devices with no recent maintenance, or expired warranties without inspection scheduled.'],
          ].map(([t, d]) => `
            <div style="background:rgba(0,0,0,.2);border-radius:8px;padding:.85rem 1rem">
              <div style="font-weight:700;font-size:.85rem;color:var(--accent3);margin-bottom:.3rem">${t}</div>
              <div style="color:var(--muted);font-size:.8rem;line-height:1.6">${d}</div>
            </div>`).join('')}
        </div>

        <div style="font-family:var(--fm);font-size:.68rem;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:.75rem">🚀 FUTURE AI/ML VISION</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.75rem">
          ${[
            ['Natural Language Processing','Allow users to describe a problem in plain text ("my laptop gets hot") and auto-detect the maintenance task needed.'],
            ['Failure Prediction Model','Train a neural network on device failure datasets to predict probability of device failure in next 30/60/90 days.'],
            ['Computer Vision','Let users upload a photo of their device and auto-detect damage, dust buildup, or wear using image classification.'],
            ['Federated Learning','Improve predictions using anonymised data from all users — without ever sharing private information.'],
          ].map(([t, d]) => `
            <div style="background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.15);border-radius:8px;padding:.85rem">
              <div style="font-weight:700;font-size:.82rem;margin-bottom:.35rem">${t}</div>
              <div style="color:var(--muted);font-size:.75rem;line-height:1.5">${d}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Tech Stack -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:1.75rem;margin-bottom:1.5rem" class="anim-fadeup anim-d3">
        <div style="font-family:var(--fm);font-size:.68rem;color:var(--accent2);text-transform:uppercase;letter-spacing:1px;margin-bottom:.75rem">TECH STACK</div>
        <h2 style="margin-bottom:1rem">Built With</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.6rem">
          ${[
            ['⚡','Vanilla JS','Frontend SPA'],
            ['🎨','CSS3 Variables','Theming + Dark/Light'],
            ['🟢','Node.js','Backend Runtime'],
            ['🚂','Express.js','REST API Framework'],
            ['🍃','MongoDB','Cloud Database'],
            ['🔐','JWT + bcrypt','Auth & Security'],
            ['📧','Nodemailer','Email Notifications'],
            ['⏰','node-cron','Scheduled Jobs'],
            ['🤖','JS ML Engine','Predictions + Scoring'],
            ['⬆','Vercel','Frontend Hosting'],
            ['🎯','Render.com','Backend Hosting'],
          ].map(([icon, name, desc]) => `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:.75rem;text-align:center">
              <div style="font-size:1.1rem;margin-bottom:4px">${icon}</div>
              <div style="font-weight:700;font-size:.78rem">${name}</div>
              <div style="color:var(--muted);font-size:.68rem">${desc}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Developer Section -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:1.75rem;margin-bottom:2rem;text-align:center" class="anim-fadeup anim-d4">
        <div style="font-family:var(--fm);font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:1rem">DEVELOPER</div>
        <div style="width:72px;height:72px;background:linear-gradient(135deg,var(--accent),var(--accent3));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 1rem">👨‍💻</div>
        <h2 style="font-size:1.1rem;margin-bottom:.35rem">PBL Student Developer</h2>
        <p style="color:var(--muted);font-size:.85rem;margin-bottom:1.25rem">Built with ❤ as a Project-Based Learning submission</p>
        <div style="display:flex;justify-content:center;gap:.75rem;flex-wrap:wrap">
          <span style="background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.2);color:var(--accent);font-family:var(--fm);font-size:.7rem;padding:4px 12px;border-radius:20px">Full-Stack Development</span>
          <span style="background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.2);color:var(--accent3);font-family:var(--fm);font-size:.7rem;padding:4px 12px;border-radius:20px">Machine Learning</span>
          <span style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);color:var(--green);font-family:var(--fm);font-size:.7rem;padding:4px 12px;border-radius:20px">Database Design</span>
          <span style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);color:var(--yellow);font-family:var(--fm);font-size:.7rem;padding:4px 12px;border-radius:20px">API Development</span>
        </div>
      </div>

    </div>`;
}
