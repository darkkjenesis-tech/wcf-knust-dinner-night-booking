/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { Lock, Unlock, Search, Users, Ticket, CheckCircle, Flame, RefreshCw, Trash2, Plus, ArrowLeft, ShieldAlert, Sparkles, Check, Download, Printer, Copy, Loader2, Calendar, ExternalLink, Mail, Phone, User, Coins } from 'lucide-react';
import { BookingConfirmation, TicketType } from '../types';
import { getBookingsFromFirestore, addBookingToFirestore, deleteBookingFromFirestore, resetBookingsInFirestore } from '../lib/firebase';
import WcfLogo from './WcfLogo';
import WinnersLogo from './WinnersLogo';
// @ts-ignore
import heroBg from '../assets/images/dark_skinned_toast_1779788617328.png';

// Hardcoded PIN for authorized workspace access
const SECURE_PIN = '5050';

// Rich pre-populated luxury attendees data (Seed data)
const SEED_ATTENDEES: BookingConfirmation[] = [
  {
    id: 'WCF-882910',
    registration: {
      fullName: 'Prof. Ebenezer Osei',
      email: 'e.osei@knust.edu.gh',
      phone: '+233 24 551 0021',
      ticketType: 'Single' as TicketType,
      quantity: 1,
    },
    amountPaid: 0,
    date: 'May 22, 2026',
    status: 'Confirmed'
  },
  {
    id: 'WCF-392014',
    registration: {
      fullName: 'Dr. Seraphina Lawson',
      email: 's.lawson@knust.edu.gh',
      phone: '+233 20 188 3491',
      ticketType: 'Double' as TicketType,
      quantity: 2,
      guestName: 'Andrews Lawson'
    },
    amountPaid: 0,
    date: 'May 23, 2026',
    status: 'Confirmed'
  },
  {
    id: 'WCF-739210',
    registration: {
      fullName: 'Gloria Mensah',
      email: 'g.mensah@wcf.org',
      phone: '+233 55 921 8210',
      ticketType: 'Single' as TicketType,
      quantity: 1,
    },
    amountPaid: 0,
    date: 'May 24, 2026',
    status: 'Confirmed'
  },
  {
    id: 'WCF-294025',
    registration: {
      fullName: 'Divine Kwaku Boateng',
      email: 'dboateng@yahoo.com',
      phone: '+233 24 931 4455',
      ticketType: 'Double' as TicketType,
      quantity: 2,
      guestName: 'Gifty Boateng'
    },
    amountPaid: 0,
    date: 'May 24, 2026',
    status: 'Confirmed'
  },
  {
    id: 'WCF-411299',
    registration: {
      fullName: 'Abigail Adobea',
      email: 'abbyadobea@gmail.com',
      phone: '+233 20 883 0012',
      ticketType: 'Single' as TicketType,
      quantity: 1,
    },
    amountPaid: 0,
    date: 'May 24, 2026',
    status: 'Confirmed'
  }
];

interface AttendeesViewProps {
  onBack: () => void;
}

export default function AttendeesView({ onBack }: AttendeesViewProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  
  // Attendee Core States
  const [attendees, setAttendees] = useState<BookingConfirmation[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<BookingConfirmation | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [recordPaymentTarget, setRecordPaymentTarget] = useState<BookingConfirmation | null>(null);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState<number>(25);
  const [isRecordingPayment, setIsRecordingPayment] = useState<boolean>(false);

  // Keypad numbers helper
  const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Submit'];

  // Initialize and load attendees
  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const firestoreList = await getBookingsFromFirestore();
        if (firestoreList.length > 0) {
          setAttendees(firestoreList);
          localStorage.setItem('wcf_registrations', JSON.stringify(firestoreList));
        } else {
          // If Firestore is empty, we automatically seed it!
          await resetBookingsInFirestore(SEED_ATTENDEES);
          setAttendees(SEED_ATTENDEES);
          localStorage.setItem('wcf_registrations', JSON.stringify(SEED_ATTENDEES));
        }
      } catch (e) {
        console.error("Failed to load attendees from Firestore:", e);
        // Fallback to local storage if offline or failed
        const localData = localStorage.getItem('wcf_registrations');
        if (localData) {
          try {
            setAttendees(JSON.parse(localData));
          } catch (err) {
            setAttendees(SEED_ATTENDEES);
          }
        } else {
          setAttendees(SEED_ATTENDEES);
        }
      }
    };

    fetchAttendees();
  }, []);

  const handlePinSubmit = (enteredPin: string) => {
    if (enteredPin === SECURE_PIN) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Access Denied. Invalid Authorization Code.');
      setPinInput('');
    }
  };

  const handleKeypadPress = (val: string) => {
    setPinError('');
    if (val === 'Clear') {
      setPinInput('');
    } else if (val === 'Submit') {
      handlePinSubmit(pinInput);
    } else {
      if (pinInput.length < 4) {
        const nextPin = pinInput + val;
        setPinInput(nextPin);
        // Auto-submit on 4th digit
        if (nextPin.length === 4) {
          setTimeout(() => handlePinSubmit(nextPin), 250);
        }
      }
    }
  };

  const handleResetAttendees = async () => {
    if (window.confirm('Are you sure you want to reset all attendees back to seed data?')) {
      try {
        await resetBookingsInFirestore(SEED_ATTENDEES);
        localStorage.setItem('wcf_registrations', JSON.stringify(SEED_ATTENDEES));
        setAttendees(SEED_ATTENDEES);
      } catch (err) {
        console.error("Failed to reset database:", err);
      }
    }
  };

  const handleDeleteAttendee = (att: BookingConfirmation) => {
    setDeleteConfirmTarget(att);
  };

  const confirmDeleteAttendee = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      await deleteBookingFromFirestore(deleteConfirmTarget.id);
      const updated = attendees.filter(a => a.id !== deleteConfirmTarget.id);
      localStorage.setItem('wcf_registrations', JSON.stringify(updated));
      setAttendees(updated);
      setDeleteConfirmTarget(null);
    } catch (err) {
      console.error("Failed to revoke ticket inside database:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadTicket = (ticket: BookingConfirmation) => {
    if (!ticket) return;
    
    // Construct real scannable QR ticket data info
    const qrData = `WCF-KNUST Dinner Night '26\nTicket: ${ticket.id}\nName: ${ticket.registration.fullName}\nType: ${ticket.registration.ticketType} Pass\nStatus: CONFIRMED ADMISSION\nDate: September 4, 2026\nVenue: TBD`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    const drawAndSave = (loadedQrImg: HTMLImageElement | null, loadedBgImg: HTMLImageElement | null) => {
      // Create an offscreen canvas with high DPI density
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 460;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Premium gradients for luxurious crimson/gold textured ticket
      const cardGradient = ctx.createLinearGradient(0, 0, 1200, 460);
      cardGradient.addColorStop(0, '#100003');
      cardGradient.addColorStop(0.3, '#210006');
      cardGradient.addColorStop(0.7, '#140003');
      cardGradient.addColorStop(1, '#0c0001');
      ctx.fillStyle = cardGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw beautiful luxury hands / wine glasses cinematic backdrop from hero Bg
      if (loadedBgImg) {
        ctx.save();
        ctx.globalAlpha = 0.08; // 8% opacity, beautifully dim and integrated
        const imgRatio = loadedBgImg.width / loadedBgImg.height;
        const canvasRatio = canvas.width / canvas.height;
        let sx = 0, sy = 0, sw = loadedBgImg.width, sh = loadedBgImg.height;
        if (imgRatio > canvasRatio) {
          sw = loadedBgImg.height * canvasRatio;
          sx = (loadedBgImg.width - sw) / 2;
        } else {
          sh = loadedBgImg.width / canvasRatio;
          sy = (loadedBgImg.height - sh) / 2;
        }
        ctx.drawImage(loadedBgImg, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Draw artistic logarithmic spiral mathematical overlay designs on canvas
      const drawCanvasSpiral = (cx: number, cy: number, startR: number, endR: number, turns: number, color: string, lineWidth: number) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        const maxTh = turns * Math.PI * 2;
        for (let th = 0; th < maxTh; th += 0.05) {
          const factor = th / maxTh;
          const r = startR + (endR - startR) * factor;
          const x = cx + r * Math.cos(th);
          const y = cy + r * Math.sin(th);
          if (th === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      };

      // Draw three elegant, low-opacity geometric spiral layers
      drawCanvasSpiral(200, 230, 20, 220, 10, 'rgba(179, 143, 111, 0.04)', 1);
      drawCanvasSpiral(700, 230, 10, 180, 8, 'rgba(179, 143, 111, 0.03)', 1);
      drawCanvasSpiral(1032, 230, 10, 130, 6, 'rgba(179, 143, 111, 0.035)', 0.75);

      // Draw elegant wine glass outline in the background of main ticket body
      const drawCanvasWineGlass = (cx: number, cy: number, scale: number) => {
        ctx.save();
        
        // Faint red wine beverage filling the glass bowl (with very low opacity)
        ctx.fillStyle = 'rgba(139, 0, 22, 0.04)';
        const liquidTopY = cy - 25 * scale;
        const bowlBottomY = cy + 10 * scale;
        ctx.beginPath();
        ctx.moveTo(cx - 36 * scale, liquidTopY);
        ctx.lineTo(cx + 36 * scale, liquidTopY);
        ctx.bezierCurveTo(cx + 38 * scale, cy - 10 * scale, cx + 30 * scale, bowlBottomY, cx, bowlBottomY + 2 * scale);
        ctx.bezierCurveTo(cx - 30 * scale, bowlBottomY, cx - 38 * scale, cy - 10 * scale, cx - 36 * scale, liquidTopY);
        ctx.fill();

        // Faint liquid surface ellipse
        ctx.fillStyle = 'rgba(139, 0, 22, 0.06)';
        ctx.beginPath();
        ctx.ellipse(cx, liquidTopY, 36 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer glass wireframe details
        ctx.strokeStyle = 'rgba(179, 143, 111, 0.06)';
        ctx.lineWidth = 1;

        // Bowl silhouette
        const rimHalfW = 40 * scale;
        const topY = cy - 80 * scale;
        ctx.beginPath();
        ctx.moveTo(cx - rimHalfW, topY);
        ctx.bezierCurveTo(cx - rimHalfW - 5 * scale, cy - 10 * scale, cx - 15 * scale, bowlBottomY, cx, bowlBottomY);
        ctx.bezierCurveTo(cx + 15 * scale, bowlBottomY, cx + rimHalfW + 5 * scale, cy - 10 * scale, cx + rimHalfW, topY);
        ctx.stroke();

        // Glass lip rim
        ctx.beginPath();
        ctx.ellipse(cx, topY, rimHalfW, 6 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Elegant long stem
        ctx.beginPath();
        ctx.moveTo(cx, bowlBottomY);
        ctx.lineTo(cx, cy + 96 * scale);
        ctx.stroke();

        // Sturdy foot base
        ctx.beginPath();
        ctx.ellipse(cx, cy + 97 * scale, 45 * scale, 7 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      };

      // Draw the beautiful wine glass at (550, 220) with scale 1.45
      drawCanvasWineGlass(550, 220, 1.45);

      // Gold frame line margin
      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(20, 20, 1160, 420);

      // Semicircular ticket punch cutout notches at divider (X = 864)
      const notchX = 864;
      
      // Top Punch
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath();
      ctx.arc(notchX, 20, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(notchX, 20, 18, 0, Math.PI, false);
      ctx.stroke();

      // Bottom Punch
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath();
      ctx.arc(notchX, 440, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(notchX, 440, 18, Math.PI, 0, false);
      ctx.stroke();

      // Perforation line split
      ctx.strokeStyle = 'rgba(179, 143, 111, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.moveTo(notchX, 42);
      ctx.lineTo(notchX, 418);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Side end notches to complete classic cinema/ticket ticket shape
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath();
      ctx.arc(20, 230, 15, 0, Math.PI * 2);
      ctx.arc(1180, 230, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(20, 230, 15, -Math.PI/2, Math.PI/2, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(1180, 230, 15, Math.PI/2, -Math.PI/2, false);
      ctx.stroke();

      // MAIN CONTENT (Left of notchX)
      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 11px "Courier New", Courier, monospace';
      ctx.fillText('DN26 // ADMISSION PASS', 50, 60);

      // Group presenter presentation Line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = 'italic 12px Georgia, serif';
      ctx.fillText("Winners' Chapel Int. & WCF Present", 50, 85);

      // Title header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Georgia, serif';
      ctx.fillText('ANNUAL GOLDEN BANQUET', 50, 122);

      // Horizontal subtle gold bar line
      ctx.strokeStyle = 'rgba(179, 143, 111, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 145);
      ctx.lineTo(820, 145);
      ctx.stroke();

      // Guest info
      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('PRIMARY ADMISSION GUEST:', 50, 180);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillText(ticket.registration.fullName, 50, 222);

      // Details Columns: Tier, ID, Date, Venue
      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('TICKET SEATING', 50, 265);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Helvetica Neue", Arial';
      ctx.fillText(`${ticket.registration.ticketType || 'Single'} PASS`, 50, 286);

      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('ADMISSION REF CODE', 240, 265);
      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 14px "Courier New"';
      ctx.fillText(ticket.id, 240, 286);

      ctx.fillStyle = 'rgba(179, 143, 111, 0.75)';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.fillText('BANQUET DATE', 450, 265);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Courier New"';
      ctx.fillText('Friday, September 4, 2026', 450, 286);

      // Location bar row
      ctx.fillStyle = 'rgba(179, 143, 111, 0.04)';
      ctx.fillRect(50, 312, 770, 48);
      ctx.strokeStyle = 'rgba(179, 143, 111, 0.15)';
      ctx.strokeRect(50, 312, 770, 48);

      ctx.fillStyle = 'rgba(179, 143, 111, 0.8)';
      ctx.font = 'bold 9.5px "Courier New", Courier, monospace';
      ctx.fillText('VENUE:', 65, 340);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Helvetica Neue"';
      ctx.fillText('TBD', 128, 340);

      // Barcode graphics render
      const barcodeX = 50;
      const barcodeY = 380;
      const barcodeH = 34;
      ctx.fillStyle = '#ffffff';
      let currentBarX = barcodeX;
      for (let i = 0; i < 75; i++) {
        const barW = [1, 2.5, 1, 4.5, 1, 1, 6, 1, 2.5][i % 9];
        const spacing = [1, 2.5, 1, 1, 4.5, 1, 2.5][i % 7];
        ctx.fillRect(currentBarX, barcodeY, barW, barcodeH);
        currentBarX += barW + spacing;
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '9px "Courier New", Courier, monospace';
      ctx.fillText(`*DN-2026-${ticket.id}*`, 50, 428);

      // STUB CONTENT (Right of notchX)
      const stubCenter = notchX + (1200 - notchX) / 2;
      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 10px "Courier New", Courier, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ADMIT ONE STUB', stubCenter, 60);

      ctx.strokeStyle = 'rgba(179, 143, 111, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(notchX + 30, 75);
      ctx.lineTo(1200 - 30, 75);
      ctx.stroke();

      const stubQrX = stubCenter - 75;
      const stubQrY = 100;
      const stubQrSize = 150;

      if (loadedQrImg) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(stubQrX, stubQrY, stubQrSize, stubQrSize);
        ctx.drawImage(loadedQrImg, stubQrX + 6, stubQrY + 6, stubQrSize - 12, stubQrSize - 12);
      } else {
        ctx.fillStyle = '#B38F6F';
        ctx.fillRect(stubQrX, stubQrY, stubQrSize, stubQrSize);
      }

      ctx.fillStyle = '#0c0001';
      ctx.beginPath();
      ctx.arc(stubCenter, stubQrY + stubQrSize / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B38F6F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 8px "Courier New"';
      ctx.fillText('WCF', stubCenter, stubQrY + stubQrSize / 2 + 2);

      // Bottom Stub identifiers
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Courier New", Courier, monospace';
      ctx.fillText(ticket.id, stubCenter, 290);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '9px "Courier New", Courier, monospace';
      ctx.fillText('ANNUAL BANQUET', stubCenter, 320);

      ctx.fillStyle = '#B38F6F';
      ctx.font = 'bold 8.5px "Courier New", Courier, monospace';
      ctx.fillText('SCAN TO VALIDATE', stubCenter, 350);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(stubCenter - 80, 375, 160, 20);
      ctx.fillStyle = '#B38F6F';
      let sbX = stubCenter - 75;
      for (let i = 0; i < 35; i++) {
        const barW = [1, 2, 1, 3, 1][i % 5];
        const spacing = [1, 2, 1][i % 3];
        ctx.fillRect(sbX, 375, barW, 20);
        sbX += barW + spacing;
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '7.5px "Courier New"';
      ctx.fillText(`SEQ-${ticket.id}`, stubCenter, 412);

      ctx.textAlign = 'left';

      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `WCF_Banquet_Ticket_${ticket.id}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.warn('Canvas export failed:', err);
      }
    };

    // Load QR from server and local background image asynchronously to render them perfectly!
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';

    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';

    let qrLoaded = false;
    let bgLoaded = false;
    let loadedQr: HTMLImageElement | null = null;
    let loadedBg: HTMLImageElement | null = null;

    const checkAndDraw = () => {
      if (qrLoaded && bgLoaded) {
        drawAndSave(loadedQr, loadedBg);
      }
    };

    qrImg.onload = () => {
      qrLoaded = true;
      loadedQr = qrImg;
      checkAndDraw();
    };
    qrImg.onerror = () => {
      qrLoaded = true;
      checkAndDraw();
    };

    bgImg.onload = () => {
      bgLoaded = true;
      loadedBg = bgImg;
      checkAndDraw();
    };
    bgImg.onerror = () => {
      bgLoaded = true;
      checkAndDraw();
    };

    qrImg.src = qrUrl;
    bgImg.src = heroBg;
  };

  const handleDownloadCSV = () => {
    const headers = [
      'Ticket ID',
      'Guest Name',
      'Email Address',
      'Phone Number',
      'Ticket Tier',
      'Total Price (GH₵)',
      'Amount Paid (GH₵)',
      'Outstanding Balance (GH₵)',
      'Payment Status',
      'Total Seats Allocated',
      'Companion Guest',
      'Registration Date'
    ];
    
    // Structure rows elegantly
    const rows = attendees.map(att => {
      const fullPrice = att.registration.ticketType === 'Table of 4' ? 350 : (att.registration.ticketType === 'Double' ? 180 : 100);
      const paid = att.amountPaid !== undefined ? att.amountPaid : fullPrice;
      const balance = fullPrice - paid;
      const progressStatus = balance <= 0 ? 'Fully Paid' : `Installment - Bal: GH₵ ${balance}`;
      return [
        att.id,
        att.registration.fullName,
        att.registration.email,
        att.registration.phone,
        att.registration.ticketType,
        fullPrice,
        paid,
        balance,
        progressStatus,
        att.registration.ticketType === 'Double' ? 2 : (att.registration.ticketType === 'Table of 4' ? 4 : 1),
        att.registration.guestName || 'None',
        att.date
      ];
    });

    // Build standard CSV body safe for commas
    const csvContent = [
      headers.join(','), 
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `WCF_KNUST_Banquet_Attendees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    setPinError('');
  };

  // Filter and search logic
  const filteredAttendees = attendees.filter(att => {
    const matchesSearch = 
      att.registration.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.registration.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.registration.phone.includes(searchQuery);

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'single') return matchesSearch && att.registration.ticketType === 'Single';
    if (filterType === 'double') return matchesSearch && att.registration.ticketType === 'Double';
    if (filterType === 'table of 4') return matchesSearch && att.registration.ticketType === 'Table of 4';
    return matchesSearch;
  });

  // Calculate high quality stats
  const totalBookings = attendees.length;
  const singleBookings = attendees.filter(a => a.registration.ticketType === 'Single').length;
  const doubleBookings = attendees.filter(a => a.registration.ticketType === 'Double').length;
  const tableBookings = attendees.filter(a => a.registration.ticketType === 'Table of 4').length;
  const totalGuestsAdmitted = attendees.reduce((acc, current) => {
    const qty = current.registration.ticketType === 'Table of 4' ? 4 : (current.registration.ticketType === 'Double' ? 2 : 1);
    return acc + qty;
  }, 0);

  return (
    <div className="pt-24 pb-20 px-6 max-w-7xl mx-auto relative z-10 selection:bg-crimson">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 group text-xs font-semibold tracking-widest uppercase text-sand hover:text-pearl transition-colors duration-300"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </button>

      {!isAuthenticated ? (
        /* LOCK SCREEN PROMPT WITH INTERACTIVE KEYPAD */
        <div className="max-w-md mx-auto bg-obsidian border border-sand/20 p-8 shadow-2xl relative">
          {/* Accent corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-sand" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-sand" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-sand" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-sand" />

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-sand/10 border border-sand/30 flex items-center justify-center mb-5 text-sand">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>
            
            <h1 className="font-serif text-2xl text-pearl tracking-wide">Secure Boardroom Access</h1>
            <p className="text-xs text-sand/60 tracking-widest uppercase font-mono mt-1.5">WCF KNUST BANQUET DATABASE</p>
            <p className="text-sm text-pearl/50 mt-4 leading-relaxed max-w-sm">
              Please enter the 4-digit security PIN to unlock the official Winners' Campus Fellowship Golden Banquet registered guest manifests.
            </p>

            {/* Verification Inputs */}
            <div className="mt-6 w-full">
              <div className="flex justify-center gap-3.5 mb-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-11 h-14 border-2 flex items-center justify-center font-mono text-xl font-bold rounded-none transition-all duration-300 ${
                      pinInput.length > index
                        ? 'border-sand bg-sand/15 text-pearl'
                        : 'border-sand/20 bg-pearl/5 text-sand/20'
                    }`}
                  >
                    {pinInput.length > index ? '•' : ''}
                  </div>
                ))}
              </div>

              {pinError && (
                <div className="text-rose-500 text-xs font-mono font-medium tracking-wide text-center mt-3 animate-bounce flex items-center justify-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {pinError}
                </div>
              )}

              {/* Security Hint */}
              <p className="text-[10px] font-mono tracking-wider text-sand/40 text-center mt-3">
                Authorized access only. Use digital device credentials.
              </p>

              {/* Physical/Custom styled keyboard layout */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {keypadNumbers.map((num) => {
                  const isSpecial = num === 'Clear' || num === 'Submit';
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className={`h-11 border text-xs tracking-widest uppercase font-mono transition-all duration-200 active:scale-95 ${
                        isSpecial
                          ? 'border-sand/15 hover:border-sand hover:bg-sand/10 text-sand hover:text-pearl font-bold'
                          : 'border-sand/10 hover:border-sand/30 bg-pearl/0 hover:bg-pearl/5 text-pearl/85 hover:text-sand'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* AUTHORIZED LIST LAYOUT SCREEN WITH CONTROLS */
        <div className="animate-fade-in-up">
          {/* Header Dashboard Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-sand/15 pb-8 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sand/15 text-sand">
                  <Unlock className="w-4 h-4 text-sand" />
                </span>
                <span className="text-xs font-mono font-semibold tracking-widest text-emerald-500 uppercase flex items-center gap-1">
                  Approved Clearance Level 1
                </span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-pearl tracking-wide font-semibold mt-1.5 font-serif-luxury">
                Prestige Control Console
              </h1>
              <p className="text-sm text-pearl/50 mt-1 max-w-xl">
                Real-time official check-in registrar, manual ticket allocator and metrics dashboard for the Golden Banquet.
              </p>
            </div>

            <div className="flex flex-row items-center gap-3 no-print">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-sand hover:bg-sand/15 text-sand text-[11px] font-bold tracking-widest uppercase transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download CSV
              </button>
              <button
                onClick={handleResetAttendees}
                title="Reset Database to Seed Data"
                className="p-2.5 border border-sand/20 hover:border-sand/50 text-pearl/70 hover:text-sand transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-crimson hover:bg-crimson/90 text-pearl text-[11px] font-bold tracking-widest uppercase transition-colors cursor-pointer"
              >
                Lock Portal
              </button>
            </div>
          </div>

            /* DATABASE REGISTRY SEARCH & LIST PANELS */
            <div className="space-y-6">
              {/* Analytics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-4 no-print2">
                <div className="bg-pearl/5 border border-sand/10 p-5 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sand/5 rounded-full translate-x-12 -translate-y-12" />
                  <div className="text-xs font-mono text-sand uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Total Bookings
                  </div>
                  <p className="text-3xl font-serif text-pearl font-bold">{totalBookings}</p>
                  <div className="text-[10px] text-pearl/40 font-mono mt-1">Receipt entries registered</div>
                </div>

                <div className="bg-pearl/5 border border-sand/10 p-5 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sand/5 rounded-full translate-x-12 -translate-y-12" />
                  <div className="text-xs font-mono text-sand uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-sand" /> Seat Allocations
                  </div>
                  <p className="text-3xl font-serif text-sand font-bold">{totalGuestsAdmitted}</p>
                  <div className="text-[10px] text-pearl/40 font-mono mt-1">Aggregated guest count</div>
                </div>

                <div className="bg-pearl/5 border border-sand/10 p-5 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sand/5 rounded-full translate-x-12 -translate-y-12" />
                  <div className="text-xs font-mono text-sand uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Single Passes
                  </div>
                  <p className="text-3xl font-serif text-pearl font-bold">{singleBookings}</p>
                  <div className="text-[10px] text-emerald-400/50 font-mono mt-1">{singleBookings} seats mapped</div>
                </div>

                <div className="bg-pearl/5 border border-sand/10 p-5 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sand/5 rounded-full translate-x-12 -translate-y-12" />
                  <div className="text-xs font-mono text-sand uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-crimson" /> Double & Tables
                  </div>
                  <p className="text-3xl font-serif text-pearl font-bold">
                    {doubleBookings} <span className="text-lg text-pearl/40">D</span> / {tableBookings} <span className="text-lg text-pearl/40">T</span>
                  </p>
                  <div className="text-[10px] text-crimson/50 font-mono mt-1">{doubleBookings * 2 + tableBookings * 4} seats allocated</div>
                </div>
              </div>

              {/* Filtering and Instant Search Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between no-print">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search guests by Name, ID, Phone or Email..."
                    className="w-full bg-pearl/5 border border-sand/25 hover:border-sand/40 focus:border-sand focus:outline-none pl-10 pr-4 py-2.5 text-xs text-pearl tracking-wide transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-sand/65">Category:</span>
                  <div className="flex rounded-none border border-sand/20 p-0.5 bg-obsidian">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'single', label: 'Single Pass' },
                      { id: 'double', label: 'Double Pass' },
                      { id: 'table of 4', label: 'Table of 4' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFilterType(tab.id)}
                        className={`px-3.5 py-1 text-[10px] tracking-widest uppercase transition-colors font-medium cursor-pointer ${
                          filterType === tab.id
                            ? 'bg-sand text-obsidian'
                            : 'text-pearl/70 hover:text-sand'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Registrations Table / Grid */}
              <div className="bg-pearl/5 border border-sand/10 rounded-none overflow-hidden hover:border-sand/20 transition-all">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-sand/15 bg-pearl/5">
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Ticket ID</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Guest / Companion Name</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Contact Information</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Pass Tier</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Payment Status</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase">Registration Date</th>
                        <th className="py-4 px-6 text-[10px] font-mono tracking-widest text-sand uppercase text-right no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand/10">
                      {filteredAttendees.length > 0 ? (
                        filteredAttendees.map((att) => {
                          const fullPrice = att.registration.ticketType === 'Table of 4' ? 350 : (att.registration.ticketType === 'Double' ? 180 : 100);
                          const paid = att.amountPaid !== undefined ? att.amountPaid : fullPrice;
                          const isFullyPaid = paid >= fullPrice;
                          return (
                            <tr key={att.id} className="hover:bg-pearl/5 transition-colors group">
                              <td className="py-4 px-6">
                                <span className="font-mono text-xs font-bold text-pearl select-all">
                                  {att.id}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="font-serif text-sm font-semibold text-pearl">
                                    {att.registration.fullName}
                                  </span>
                                  {att.registration.guestName && (
                                    <span className="text-[10px] font-mono tracking-wide text-sand/60 mt-0.5 truncate max-w-[200px]">
                                      Companion: + {att.registration.guestName}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="font-mono text-[11px] text-pearl/80">
                                    {att.registration.email}
                                  </span>
                                  <span className="font-mono text-[10px] text-pearl/40 mt-0.5">
                                    {att.registration.phone}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-block px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest ${
                                  att.registration.ticketType === 'Table of 4'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    : att.registration.ticketType === 'Double'
                                      ? 'bg-crimson/15 text-crimson border border-crimson/20'
                                      : 'bg-sand/15 text-sand border border-sand/20'
                                  }`}>
                                  {att.registration.ticketType} Pass
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest rounded-sm w-fit ${
                                    isFullyPaid 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {isFullyPaid ? 'Fully Paid' : 'Installment'}
                                  </span>
                                  <span className="text-[11px] font-mono text-pearl/80 mt-1">
                                    Paid: GH₵ {paid} / {fullPrice}
                                  </span>
                                  {att.paymentRef && (
                                    <span className="text-[9px] font-mono text-emerald-400/80 mt-0.5 truncate max-w-[150px]" title={`Ref: ${att.paymentRef}`}>
                                      Ref: {att.paymentRef}
                                    </span>
                                  )}
                                  {att.paymentMethod && (
                                    <span className="text-[8px] font-mono text-pearl/30 uppercase tracking-wider block mt-0.5">
                                      {att.paymentMethod}
                                    </span>
                                  )}
                                  {!isFullyPaid && (
                                    <span className="text-[9px] font-mono text-amber-500/80 mt-0.5">
                                      Bal: GH₵ {fullPrice - paid}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-xs text-pearl/60 font-mono">
                                  {att.date}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right no-print">
                                <div className="flex items-center justify-end gap-2 text-right">
                                  {isFullyPaid ? (
                                    <button
                                      onClick={() => handleDownloadTicket(att)}
                                      className="p-2 text-sand hover:text-pearl hover:bg-sand/15 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center justify-center"
                                      title="Download Ticket as PNG"
                                    >
                                      <Download className="w-4.5 h-4.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setRecordPaymentTarget(att);
                                        const remaining = fullPrice - paid;
                                        setExtraPaymentAmount(remaining);
                                      }}
                                      className="p-2 text-amber-500 hover:text-amber-400 hover:bg-[#B38F6F]/10 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center justify-center animate-pulse"
                                      title={`Click to record payment: GH₵ ${fullPrice - paid} path-payment outstanding`}
                                    >
                                      <Lock className="w-4 h-4 text-amber-500" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteAttendee(att)}
                                    className="p-2 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all duration-200 cursor-pointer inline-flex items-center justify-center"
                                    title="Revoke Registration Access"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-sm text-pearl/50 font-serif italic">
                            No registered attendees matched your filter parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-pearl/5 border-t border-sand/10 py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-mono text-sand/50">
                    Viewing {filteredAttendees.length} of {attendees.length} Verified Records
                  </span>
                  <span className="text-[10px] font-mono text-sand/40">
                    Winners’ Campus Fellowship Dinner Night Office Registry • Kumasi, GH
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/95 backdrop-blur-sm animate-fade-in-up no-print">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#1c0205] to-[#0c0001] border-2 border-red-500/40 p-8 shadow-2xl rounded-xl">
            {/* Elegant luxury gold/crimson styling corner accents */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-red-500/50" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-red-500/50" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-red-500/50" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-red-500/50" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl text-pearl leading-tight font-semibold">Revoke Banquet Admission?</h2>
              <p className="text-[10px] font-mono text-[#B38F6F] tracking-widest uppercase mt-2">CONFIRM TRANSACTION CANCELLATION</p>
            </div>

            <div className="bg-[#050000] border border-red-500/15 p-5 mb-6 text-left rounded-lg space-y-3 font-sans">
              <div>
                <span className="text-[9px] font-mono text-sand/40 uppercase block">Ticket Identifier</span>
                <span className="text-xs font-mono font-bold text-pearl select-all">{deleteConfirmTarget.id}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-sand/40 uppercase block">Primary Guest Name</span>
                <span className="text-sm font-semibold text-pearl">{deleteConfirmTarget.registration.fullName}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-[#B38F6F] uppercase block">Pass Category</span>
                <span className="text-xs font-mono font-bold text-sand uppercase">
                  {deleteConfirmTarget.registration.ticketType} Pass
                </span>
              </div>
              <div className="pt-2.5 border-t border-red-500/10 text-[10.5px] text-pearl/50 leading-relaxed font-sans mt-2.5 flex gap-2">
                <span className="text-rose-500 font-bold">⚠️</span>
                <span>
                  Deleting this entry will permanently revoke active list credentials and render the associated ticket's scannable barcode invalid at check-in.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                className="w-full sm:w-1/2 py-3 border border-sand/20 hover:border-sand/40 text-[#B38F6F] text-xs font-bold tracking-widest uppercase bg-[#B38F6F]/5 hover:bg-[#B38F6F]/10 transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteAttendee}
                className="w-full sm:w-1/2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800/40 text-pearl text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-pearl" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {recordPaymentTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/95 backdrop-blur-sm animate-fade-in-up no-print">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#120002] to-[#040001] border-2 border-[#B38F6F] p-8 shadow-2xl rounded-xl">
            {/* Elegant luxury gold/crimson styling corner accents */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#B38F6F]/50" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#B38F6F]/50" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#B38F6F]/50" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#B38F6F]/50" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2.5xl text-pearl leading-tight font-semibold">Record Installment</h2>
              <p className="text-[10px] font-mono text-[#B38F6F] tracking-widest uppercase mt-2">Update Attendee Balance Information</p>
            </div>

            <div className="bg-[#0c0001] border border-sand/15 p-5 mb-6 text-left rounded-lg space-y-3 font-sans">
              <div>
                <span className="text-[9px] font-mono text-sand/40 uppercase block">Ticket ID</span>
                <span className="text-xs font-mono font-bold text-pearl select-all">{recordPaymentTarget.id}</span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-sand/40 uppercase block">Attendee Name</span>
                <span className="text-sm font-semibold text-pearl">{recordPaymentTarget.registration.fullName}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[9px] font-mono text-sand/40 uppercase block">Current Paid</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold block mt-0.5">GH₵ {recordPaymentTarget.amountPaid}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-sand/40 uppercase block">Remaining Balance</span>
                  <span className="text-xs font-mono text-amber-500 font-bold block mt-0.5">
                    GH₵ {(recordPaymentTarget.registration.ticketType === 'Table of 4' ? 350 : (recordPaymentTarget.registration.ticketType === 'Double' ? 180 : 100)) - (recordPaymentTarget.amountPaid || 0)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-sand/10">
                <label htmlFor="extraPaymentInput" className="block text-[10px] font-mono uppercase tracking-widest text-[#B38F6F] mb-2 font-semibold">
                  Amount Received (GH₵)
                </label>
                <input
                  id="extraPaymentInput"
                  type="number"
                  min="1"
                  max={(recordPaymentTarget.registration.ticketType === 'Table of 4' ? 350 : (recordPaymentTarget.registration.ticketType === 'Double' ? 180 : 100)) - (recordPaymentTarget.amountPaid || 0)}
                  value={extraPaymentAmount}
                  onChange={(e) => setExtraPaymentAmount(Number(e.target.value))}
                  className="w-full bg-obsidian border border-sand/35 focus:border-[#B38F6F] text-pearl font-serif font-bold text-lg p-2.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isRecordingPayment}
                onClick={() => setRecordPaymentTarget(null)}
                className="w-full sm:w-1/2 py-3 border border-sand/20 hover:border-sand/40 text-pearl text-xs font-bold tracking-widest uppercase bg-pearl/5 hover:bg-pearl/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRecordingPayment}
                onClick={async () => {
                  setIsRecordingPayment(true);
                  const fullPrice = recordPaymentTarget.registration.ticketType === 'Table of 4' ? 350 : (recordPaymentTarget.registration.ticketType === 'Double' ? 180 : 100);
                  const newTotalPaid = Math.min((recordPaymentTarget.amountPaid || 0) + extraPaymentAmount, fullPrice);
                  
                  const updatedRecord: BookingConfirmation = {
                    ...recordPaymentTarget,
                    amountPaid: newTotalPaid,
                    status: newTotalPaid >= fullPrice ? 'Confirmed' : 'Pending'
                  };

                  try {
                    await addBookingToFirestore(updatedRecord);
                    const updatedList = attendees.map(a => a.id === updatedRecord.id ? updatedRecord : a);
                    localStorage.setItem('wcf_registrations', JSON.stringify(updatedList));
                    setAttendees(updatedList);
                    setRecordPaymentTarget(null);
                  } catch (err) {
                    console.error("Failed to update booking amountPaid inside Firestore:", err);
                  } finally {
                    setIsRecordingPayment(false);
                  }
                }}
                className="w-full sm:w-1/2 py-3 bg-[#B38F6F] hover:bg-[#8f6f52] disabled:bg-sand/30 text-obsidian font-bold text-xs tracking-widest uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                {isRecordingPayment ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
