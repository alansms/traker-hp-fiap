import React from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Paper, Typography } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const AlertList = ({ alerts, onDeleteAlert }) => {
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Alertas Ativos
      </Typography>
      <List>
        {alerts?.map((alert) => (
          <ListItem key={alert.id}>
            <ListItemText
              primary={alert.product_name}
              secondary={`Preço alvo: R$ ${alert.target_price}`}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => onDeleteAlert(alert.id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default AlertList;
