import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Button,
  Box,
  Stack
} from '@mui/material';

const AppInfoModal = ({ open, onClose }) => {
  const handleCopyAndClose = () => {
    const infoText = `
HP Tracker ML 2025.1.0
Build #HPML-251.10420.001, built on May 28, 2025

Licensed to Alan de Souza Maximiano da Silva
Subscription is active until March 26, 2026.
For educational use only.

Runtime version: Python 3.11.8 (CPython) aarch64
Framework: React 18 + FastAPI 0.111
VM: V8 Engine + Chromium Embedded
OS: macOS 15.5 (Sonoma)

Powered by open-source software
Copyright © 2020–2025 HP Tracker ML Project
    `;

    navigator.clipboard.writeText(infoText.trim());
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: '#2b2b2b',
          color: '#fff',
          padding: 3,
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: 20 }}>
        About HP Tracker ML
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>HP Tracker ML 2025.1.0</strong><br />
          Build #HPML-251.10420.001, built on May 28, 2025<br />
          <br />
          Licensed to Alan de Souza Maximiano da Silva<br />
          Subscription is active until March 26, 2026.<br />
          For educational use only.
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Runtime version: Python 3.11.8 (CPython) aarch64<br />
          Framework: React 18 + FastAPI 0.111<br />
          VM: V8 Engine + Chromium Embedded<br />
          OS: macOS 15.5 (Sonoma)
        </Typography>

        <Typography variant="body2">
          Powered by <a href="https://smstecnologia.com.br" style={{ color: '#4fc3f7' }}>SMS Tecnologia</a><br />
          Copyright © 2020–2025 HP Tracker ML Project
        </Typography>
      </DialogContent>

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" color="inherit" onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" color="primary" onClick={handleCopyAndClose}>
          Copy and Close
        </Button>
      </Stack>
    </Dialog>
  );
};

export default AppInfoModal;
