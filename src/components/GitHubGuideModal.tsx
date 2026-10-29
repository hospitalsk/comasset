import React, { useState } from 'react';
import { X, Github, Copy, Check, Terminal, ExternalLink, Globe, Sparkles } from 'lucide-react';

interface GitHubGuideModalProps {
  onClose: () => void;
}

export const GitHubGuideModal: React.FC<GitHubGuideModalProps> = ({ onClose }) => {
  const [repoName, setRepoName] = useState('thai-gov-asset-management');
  const [githubUser, setGithubUser] = useState('YOUR_GITHUB_USERNAME');
  const [githubToken, setGithubToken] = useState('');
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const cleanUser = githubUser.trim() || 'YOUR_GITHUB_USERNAME';
  const cleanRepo = repoName.trim() || 'thai-gov-asset-management';
  const repoHttpsUrl = `https://github.com/${cleanUser}/${cleanRepo}.git`;
  const tokenRemoteUrl = githubToken.trim()
    ? `https://${githubToken.trim()}@github.com/${cleanUser}/${cleanRepo}.git`
    : repoHttpsUrl;

  const allInOneCommand = `# รันคำสั่งนี้เพื่อเชื่อมต่อและ Push ขึ้น GitHub ทันที:
git remote remove origin 2>/dev/null || true
git remote add origin ${tokenRemoteUrl}
git branch -M main
git push -u origin main --force`;

  const gitSteps = [
    {
      title: '1. สร้าง Repository ใหม่บน GitHub',
      desc: 'เข้าสู่ github.com/new แล้วตั้งชื่อคลังโปรเจกต์ (เช่น thai-gov-asset-management) โดยเลือกเป็น Public หรือ Private ก็ได้ (ไม่ต้องติ๊ก Add a README file)',
      cmd: null,
      link: 'https://github.com/new',
      linkText: 'กดเปิดหน้าสร้าง Repo ใหม่บน GitHub'
    },
    {
      title: '2. เชื่อมต่อ Git Remote กับ Repository ของคุณ',
      desc: 'ระบุ URL ปลายทางของ GitHub Repository (ที่ระบบเตรียมไว้ให้ด้านล่าง)',
      cmd: `git remote remove origin 2>/dev/null || true\ngit remote add origin ${tokenRemoteUrl}\ngit branch -M main`
    },
    {
      title: '3. Push โค้ดทั้งหมดขึ้น GitHub',
      desc: 'ส่งโค้ดทั้งหมด (ที่คอมมิตเรียบร้อยแล้ว) ไปยัง branch main บน GitHub',
      cmd: `git push -u origin main`
    },
    {
      title: '4. เปิดใช้งาน GitHub Pages เพื่อให้คนอื่นเปิดเว็บได้ฟรี (ทางเลือก)',
      desc: 'ในหน้า GitHub Repo ไปที่ Settings > Pages > เปลี่ยน Source เป็น "GitHub Actions" ระบบจะบิลด์และ Deploy เว็บให้อัตโนมัติด้วยไฟล์ .github/workflows/deploy.yml',
      cmd: null
    }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden border border-slate-200 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">วิธี Deploy & Push โค้ดขึ้น GitHub</h3>
              <p className="text-slate-500 text-[11px]">โค้ดทั้งหมดในโปรเจกต์ถูกทำ Git Commit ไว้พร้อมส่งขึ้น GitHub แล้ว</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>สถานะ Git:</strong> คลังโค้ดถูก Initialized และทำ Commit พร้อมไฟล์สมบูรณ์แล้ว (Branch: main)</span>
          </div>

          {/* Inputs for customization */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="font-semibold text-slate-800 text-[13px]">ระบุข้อมูลบัญชี GitHub ของคุณ เพื่อสร้างคำสั่งอัตโนมัติ:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">GitHub Username:</label>
                <input
                  type="text"
                  value={githubUser}
                  onChange={e => setGithubUser(e.target.value.trim() || '')}
                  placeholder="เช่น somchai-dev"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">ชื่อ Repository บน GitHub:</label>
                <input
                  type="text"
                  value={repoName}
                  onChange={e => setRepoName(e.target.value.trim() || '')}
                  placeholder="thai-gov-asset-management"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                GitHub Personal Access Token (PAT) (ไม่บังคับ แต่สะดวกมากหากใช้ HTTPS Push):
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={e => setGithubToken(e.target.value.trim())}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx (ใส่เพื่อไม่ต้องพิมพ์รหัสผ่านตอน Push)"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                สร้างได้ที่ GitHub &gt; Settings &gt; Developer Settings &gt; Personal Access Tokens (Tokens classic) &gt; ติ๊กสิทธิ์ <code>repo</code>
              </span>
            </div>
          </div>

          {/* All in one copy button */}
          <div className="border border-sky-200 bg-sky-50/60 p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sky-900 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-sky-600" />
                คำสั่งด่วน One-Click (คัดลอกแล้วรันใน Terminal ทีเดียวเสร็จ)
              </span>
              <button
                onClick={() => handleCopy(allInOneCommand, 'all')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs transition-colors"
              >
                {copiedStep === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStep === 'all' ? 'คัดลอกแล้ว!' : 'คัดลอกคำสั่งทั้งหมด'}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
              {allInOneCommand}
            </pre>
          </div>

          {/* Detailed Steps */}
          <div className="space-y-3 pt-2">
            <div className="font-semibold text-slate-800 text-[13px]">ขั้นตอนแบบละเอียด:</div>
            {gitSteps.map((step, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="font-semibold text-slate-800">{step.title}</div>
                  {step.cmd && (
                    <button
                      onClick={() => handleCopy(step.cmd!, `step-${idx}`)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                    >
                      {copiedStep === `step-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedStep === `step-${idx}` ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  )}
                </div>
                <div className="p-3 text-slate-600 space-y-2">
                  <p>{step.desc}</p>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-800 underline"
                    >
                      <span>{step.linkText}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {step.cmd && (
                    <pre className="p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {step.cmd}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Deploy to GitHub Pages info */}
          <div className="border border-amber-200 bg-amber-50/70 p-3.5 rounded-xl text-amber-900 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-amber-700" />
              การตั้งค่า GitHub Pages สำหรับเปิดใช้งานระบบออนไลน์
            </div>
            <p className="text-[11px] text-amber-800">
              ระบบได้เตรียมไฟล์ <code>.github/workflows/deploy.yml</code> ไว้ในโปรเจกต์เรียบร้อยแล้ว เมื่อ Push ขึ้น GitHub แล้ว เพียงเข้าไปที่ Settings ของ Repository แล้วเลือก Pages &gt; Build and deployment: <strong>GitHub Actions</strong> เว็บไซต์จะถูก Build และ Deploy เป็น URL ออนไลน์ฟรีให้อัตโนมัติทันที
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
