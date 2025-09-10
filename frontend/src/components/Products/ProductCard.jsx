import React from 'react';
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Preço Atual: R$ {product.current_price}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Menor Preço: R$ {product.lowest_price}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" component={Link} to={`/products/${product.id}`}>
          Ver Detalhes
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
