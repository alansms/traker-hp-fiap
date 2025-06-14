{/* Código para a aba de Vendedores - Insira este bloco na seção correspondente */}
{tabValue === 3 && (
  <Grid container spacing={3}>
    {/* Desempenho detalhado de Vendedores */}
    <Grid item xs={12}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Análise de Vendedores</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Dados reais dos vendedores captados através das buscas e armazenados no Elasticsearch.
        </Typography>

        {/* Gráfico de Reputação dos Vendedores */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Reputação dos Principais Vendedores</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={analysisData.sellerPerformance}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 5]} />
            <Tooltip formatter={(value, name) => name === 'reputation' ? `${value} ★` : value} />
            <Legend />
            <Bar dataKey="reputation" fill="#FFD700" name="Reputação (1-5 ★)" />
          </BarChart>
        </ResponsiveContainer>

        {/* Gráfico de Preço Médio por Vendedor */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>Preço Médio por Vendedor</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={analysisData.sellerPerformance}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="avgPrice" fill="#8884d8" name="Preço Médio (R$)" />
          </BarChart>
        </ResponsiveContainer>

        {/* Tabela de Vendedores */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>Detalhes dos Vendedores</Typography>
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Vendedor</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Reputação</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Produtos</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Preço Médio</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Vendas Estimadas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysisData.sellerPerformance.map((seller, index) => (
                <TableRow key={index} hover>
                  <TableCell>{seller.name}</TableCell>
                  <TableCell align="center">
                    {seller.reputation.toFixed(1)} ★
                  </TableCell>
                  <TableCell align="center">{seller.products}</TableCell>
                  <TableCell align="right">
                    {seller.avgPrice ? `R$ ${seller.avgPrice.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell align="right">{seller.sales}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Grid>
  </Grid>
)}
