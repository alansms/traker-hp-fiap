{tabValue === 2 && (
  <Grid container spacing={3}>
    {/* Detalhes de Categorias */}
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>Distribuição por Categoria</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={analysisData.categoryDistribution}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value) => `${value} produtos`} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Quantidade" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>

    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>Proporção de Categorias</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={analysisData.categoryDistribution}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {analysisData.categoryDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} produtos`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>

    <Grid item xs={12}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Preço Médio por Categoria</Typography>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={analysisData.categoryDistribution.map(cat => ({
              ...cat,
              avgPrice: (Math.random() * 300 + 100).toFixed(2) // Simulação - substituir por dados reais quando disponíveis
            }))}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `R$ ${value}`} />
            <Legend />
            <Bar dataKey="avgPrice" fill="#82ca9d" name="Preço Médio (R$)" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>
  </Grid>
)}
