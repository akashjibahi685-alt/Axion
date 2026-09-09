import React, { useState, useEffect } from 'react';
import { useClub } from '../../context/ClubContext';
import { Modal } from '../layout/Modal';
import { GithubIcon } from '../common/Icons';
import { StudentLearningHub } from './StudentLearningHub';

import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  MapPin,
  ExternalLink,
  ShieldCheck,
  LogOut,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Calendar,
  Star,
  Mail,
  Share2
} from 'lucide-react';

export function LivePortalPreview() {
  const {
    data,
    setIsLivePreviewOpen,
    setIsAdminLoginOpen,
    rsvpToEvent,
    isAuthenticated,
    currentUser,
    logout
  } = useClub();

  const [openFaq, setOpenFaq] = useState(0);
  const [rsvpModalEvent, setRsvpModalEvent] = useState(null);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpEmail, setRsvpEmail] = useState('');

  const activeAnnouncement = (data.announcements || []).find((a) => a.isActive);

  // Background Slideshow Logic
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = data.cmsPages?.hero?.slides?.length 
    ? data.cmsPages.hero.slides 
    : ['/slideshow/slide1.jpg', '/slideshow/slide2.jpg', '/slideshow/slide3.jpg'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    if (rsvpModalEvent && rsvpName && rsvpEmail) {
      rsvpToEvent(rsvpModalEvent.id, { name: rsvpName, email: rsvpEmail });
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });
      setRsvpModalEvent(null);
      setRsvpName('');
      setRsvpEmail('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'var(--bg-app)',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Active Site Announcement Banner */}
      {activeAnnouncement && (
        <div
          style={{
            background: 'linear-gradient(90deg, #ff4d4d, #ffaf40, #fffa65, #32ff7e, #18dcff, #7efff5, #cd84f1)',
            backgroundSize: '400% 400%',
            animation: 'rainbowBg 15s ease infinite',
            color: '#1e293b',
            padding: '10px 0',
            textAlign: 'center',
            fontSize: '0.88rem',
            fontWeight: 800,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 100,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <style>
            {`
              @keyframes rainbowBg {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              @keyframes marqueeScroll {
                0% { transform: translateX(100vw); }
                100% { transform: translateX(-100%); }
              }
            `}
          </style>
          
          <div style={{
             display: 'inline-flex',
             alignItems: 'center',
             gap: '12px',
             animation: 'marqueeScroll 25s linear infinite'
          }}>
            <span className="badge badge-rose" style={{ background: 'white', color: '#e11d48', fontWeight: 800 }}>
              {activeAnnouncement.urgency}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>{activeAnnouncement.title}</strong> — {activeAnnouncement.content}
            </span>
          </div>
        </div>
      )}

      {/* Public Navbar */}
      <header
        style={{
          padding: '6px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-glass)',
          position: 'sticky',
          top: 0,
          zIndex: 80
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 0, margin: 0 }}>
          <img
            src={data.branding.logoUrl || '/logo.jpg'}
            alt="Club Logo"
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', display: 'block', padding: 0, margin: 0 }}
          />
          <div style={{ padding: 0, margin: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {data.branding.clubName}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              {data.branding.university}
            </div>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <a href="#learning" className="wavy-hover-link" style={{ color: '#0891b2', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <GraduationCap size={16} />
            <span>Learning Hub</span>
          </a>
          <a href="#about" className="wavy-hover-link" style={{ color: 'inherit' }}>About</a>
          <a href="#events" className="wavy-hover-link" style={{ color: 'inherit' }}>Events</a>
          <a href="#projects" className="wavy-hover-link" style={{ color: 'inherit' }}>Projects</a>
          <a href="#blog" className="wavy-hover-link" style={{ color: 'inherit' }}>Articles</a>
          <a href="#faq" className="wavy-hover-link" style={{ color: 'inherit' }}>FAQ</a>
        </nav>

        <div className="auth-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <style>
            {`
              .auth-actions-group .logout-btn {
                opacity: 0;
                transform: translateX(-10px);
                transition: all 0.3s ease;
                pointer-events: none;
              }
              .auth-actions-group:hover .logout-btn {
                opacity: 1;
                transform: translateX(0);
                pointer-events: auto;
              }
            `}
          </style>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIsLivePreviewOpen(false)}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '7px 16px', gap: '6px' }}
                title="Go to Personal Dashboard"
              >
                <ShieldCheck size={14} />
                <span>My Dashboard</span>
              </button>

              <button
                onClick={logout}
                className="btn-icon logout-btn"
                style={{ color: '#f43f5e', padding: '6px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '50%' }}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsLivePreviewOpen(false);
                setIsAdminLoginOpen(true);
              }}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '7px 16px', gap: '6px' }}
            >
              <GraduationCap size={14} />
              <span>My Dashboard</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: '120px 32px 140px',
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Slideshow */}
        {slides.map((slide, index) => (
          <div
            key={slide}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${slide})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              zIndex: 0
            }}
          />
        ))}

        {/* Dark overlay for text readability */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.6))',
            zIndex: 1
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', width: '100%' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#22d3ee',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '28px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Sparkles size={14} />
            <span>{data.cmsPages?.hero?.badge || '✦ AXION TECHNICAL & AI/ML CLUB'}</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.0rem, 4.5vw, 3.4rem)',
              fontWeight: 900,
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              marginBottom: '24px',
              maxWidth: '1000px',
              marginLeft: 'auto',
              marginRight: 'auto',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(255, 255, 255, 0.4)',
              background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.9) 70%, rgba(255,255,255,0.4) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              textShadow: '0px 8px 16px rgba(0, 0, 0, 0.3), 0px 4px 8px rgba(255, 255, 255, 0.1)',
              filter: 'drop-shadow(0px 2px 4px rgba(255, 255, 255, 0.2))'
            }}
          >
            {data.cmsPages?.hero?.title}
          </h1>

          <div
            key={currentSlide}
            style={{
              fontSize: '1.25rem',
              color: '#cbd5e1',
              maxWidth: '780px',
              margin: '0 auto 40px',
              lineHeight: '1.6',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.25em'
            }}
          >
            {(data.cmsPages?.hero?.subtitle || "Join an elite community of student researchers, engineers, and builders developing open-source models, competitive AI solutions, and state-of-the-art intelligent systems.")
              .split(" ")
              .map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.6, delay: index * 0.05 + 0.5, ease: 'easeOut' }}
                >
                  {word}
                </motion.span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a href="#events" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem', background: '#0ea5e9', border: 'none' }}>
              <span>{data.cmsPages?.hero?.ctaPrimary || 'Join the Club'}</span>
              <ArrowRight size={14} />
            </a>
            <a href="#projects" className="btn" style={{ padding: '8px 20px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
              <span>{data.cmsPages?.hero?.ctaSecondary || 'Explore Projects'}</span>
            </a>
          </div>


        </div>
      </section>


      {/* About & Mission Section */}
      <section id="about" style={{ padding: '80px 32px', background: 'var(--bg-glass-card)', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="badge badge-lavender" style={{ marginBottom: '10px' }}>Our Mission & Values</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>{data.cmsPages?.about?.heading}</h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '750px', margin: '12px auto 0' }}>
              {data.cmsPages?.about?.narrative}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {(data.cmsPages?.mission?.points || []).map((pt, i) => (
              <div key={i} className="glass-panel" style={{ padding: '28px', background: 'var(--bg-surface)' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: i === 0 ? 'var(--cyan-soft)' : i === 1 ? '#f5f3ff' : '#ecfdf5',
                    color: i === 0 ? 'var(--cyan-accent)' : i === 1 ? '#8b5cf6' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{pt.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{pt.desc}</p>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '40px',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #f0fdfa, #f5f3ff)',
              textAlign: 'center',
              fontWeight: 700,
              color: '#0891b2',
              fontSize: '0.95rem'
            }}
          >
            🏆 {data.cmsPages?.about?.statsHighlight}
          </div>
        </div>
      </section>

      {/* Student Learning Hub & LMS Master Tracks Section */}
      <section id="learning" style={{ background: 'var(--bg-glass-subtle)', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)' }}>
        <StudentLearningHub />
      </section>

      {/* Events & Workshops Section */}
      <section id="events" style={{ padding: '80px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>Upcoming Schedule</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Workshops, Hackathons & Seminars</h2>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Free for all registered students
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {(data.events || []).map((evt) => (
            <div key={evt.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="badge badge-cyan">{evt.type}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan-accent)' }}>
                    {evt.rsvps} / {evt.capacity} RSVPs
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>{evt.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {evt.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} color="var(--cyan-accent)" />
                    <span>{evt.date} • {evt.time}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={15} color="#8b5cf6" />
                    <span>{evt.location}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setRsvpModalEvent(evt)}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '20px' }}
              >
                <span>Reserve Seat (RSVP)</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" style={{ padding: '80px 32px', background: 'var(--bg-glass-card)', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="badge badge-emerald" style={{ marginBottom: '8px' }}>Innovation Labs</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Featured AI/ML Research & Projects</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {(data.projects || []).map((proj) => (
              <div key={proj.id} className="glass-panel" style={{ overflow: 'hidden' }}>
                <img src={proj.image} alt={proj.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="badge badge-lavender">{proj.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                      <Star size={14} fill="#f59e0b" />
                      <span>{proj.stars || 0}</span>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>{proj.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {proj.description}
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {proj.github && (
                      <a href={proj.github} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, fontSize: '0.78rem' }}>
                        <GithubIcon size={14} />
                        <span>Source Code</span>
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1, fontSize: '0.78rem' }}>
                        <ExternalLink size={14} />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" style={{ padding: '80px 32px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>Got Questions?</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(data.cmsPages?.faqs || []).map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="glass-panel"
                style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
              >
                <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {faq.question}
                  </span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {isOpen && (
                  <div style={{ padding: '0 24px 20px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Public Footer */}
      <footer style={{ background: '#090d16', color: 'white', padding: '60px 48px 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', borderBottom: '1px solid #1e293b', paddingBottom: '40px' }}>
          <div style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <img src={data.branding.logoUrl || '/logo.jpg'} alt="Logo" style={{ width: '38px', height: '38px', borderRadius: '10px' }} />
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>{data.branding.clubName}</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: '1.6' }}>
              {data.branding.description}
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '12px', color: '#f8fafc' }}>Quick Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#94a3b8' }}>
              {(data.cmsPages?.footer?.links || [
                { label: 'About Us', href: '#about' },
                { label: 'Workshops & Hackathons', href: '#events' },
                { label: 'Research Showcase', href: '#projects' },
                { label: 'Club FAQ', href: '#faq' }
              ]).map((link, idx) => (
                <a key={idx} href={link.href} className="wavy-hover-link" style={{ color: 'inherit' }}>{link.label}</a>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '12px', color: '#f8fafc' }}>Connect & Code</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href={data.branding.socials?.github || '#'} target="_blank" rel="noreferrer" className="btn-icon" style={{ color: 'white', background: '#1e293b' }}>
                <GithubIcon size={18} />
              </a>
              <a href={data.branding.socials?.discord || '#'} target="_blank" rel="noreferrer" className="btn-icon" style={{ color: 'white', background: '#1e293b' }}>
                <Share2 size={18} />
              </a>
              <a href={`mailto:${data.branding.contactEmail}`} className="btn-icon" style={{ color: 'white', background: '#1e293b' }}>
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '24px', fontSize: '0.78rem', color: '#64748b' }}>
          <div>© {new Date().getFullYear()} {data.branding.clubName} • {data.branding.university}. All rights reserved.</div>
          <div>
            {isAuthenticated && currentUser && currentUser.role !== 'Member' && (
              <button
                onClick={() => setIsLivePreviewOpen(false)}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
              >
                🔐 Go to Admin Control Center ({currentUser?.name.split(' ')[0]})
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* RSVP Modal */}
      <Modal
        isOpen={!!rsvpModalEvent}
        onClose={() => setRsvpModalEvent(null)}
        title="Reserve Your Seat"
        subtitle={rsvpModalEvent?.title}
      >
        <form onSubmit={handleRsvpSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Maya Lin"
              value={rsvpName}
              onChange={(e) => setRsvpName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Student Email Address *</label>
            <input
              type="email"
              required
              placeholder="maya.lin@student.edu"
              value={rsvpEmail}
              onChange={(e) => setRsvpEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={() => setRsvpModalEvent(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm My RSVP
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
