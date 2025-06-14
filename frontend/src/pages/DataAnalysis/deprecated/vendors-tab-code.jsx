{tabValue === 3 && (
  <Grid container spacing={3}>
    {/* Reputação dos Vendedores */}
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>Reputação dos Vendedores</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={analysisData.sellerPerformance}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 5]} />
            <Tooltip formatter={(value) => value.toFixed(1)} />
            <Legend />
            <Bar dataKey="reputation" fill="#8884d8" name="Pontuação (0-5)" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>

    {/* Volume de Vendas */}
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>Volume de Vendas</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={analysisData.sellerPerformance}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={120}
              fill="#8884d8"
              dataKey="sales"
              nameKey="name"
              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {analysisData.sellerPerformance.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} vendas`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>

    {/* Quantidade de Produtos por Vendedor */}
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>Quantidade de Produtos</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={analysisData.sellerPerformance}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="products" fill="#82ca9d" name="Produtos Cadastrados" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>

    {/* Tabela de Desempenho dos Vendedores */}
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>Análise Comparativa</Typography>
        <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Vendedor</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Reputação</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Vendas</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Produtos</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Média p/ Produto</th>
              </tr>
            </thead>
            <tbody>
              {analysisData.sellerPerformance.map((seller, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{seller.name}</td>
                  <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                    {seller.reputation.toFixed(1)}
                    <span style={{ color: seller.reputation >= 4.5 ? 'green' : seller.reputation >= 4.0 ? 'orange' : 'red' }}>
                      {' '}{seller.reputation >= 4.5 ? '★★★★★' : seller.reputation >= 4.0 ? '★★★★☆' : '★★★☆☆'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{seller.sales}</td>
                  <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{seller.products}</td>
                  <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                    {(seller.sales / seller.products).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Paper>
    </Grid>

    {/* Correlação entre Reputação e Vendas */}
    <Grid item xs={12}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Correlação entre Reputação e Vendas</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={analysisData.sellerPerformance}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Vendas" />
            <Bar yAxisId="right" dataKey="reputation" fill="#82ca9d" name="Reputação (0-5)" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>
  </Grid>
)}
