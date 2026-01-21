export const getGoalImage = (goalName: string): string => {
  const name = goalName.toLowerCase();
  
  if (name.includes('carro') || name.includes('veículo') || name.includes('automóvel')) {
    return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  }
  if (name.includes('viagem') || name.includes('viajar') || name.includes('férias')) {
    return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=821&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  }
  if (name.includes('casa') || name.includes('apartamento') || name.includes('imóvel')) {
    return 'https://plus.unsplash.com/premium_photo-1689609950112-d66095626efb?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  }
  if (name.includes('emergência') || name.includes('reserva') || name.includes('contingência')) {
    return 'https://media.istockphoto.com/id/1320909203/pt/foto/ambulance-car-on-the-asphalt-among-the-trees.jpg?s=1024x1024&w=is&k=20&c=lsN_u727WBRyAH3z2oemhL3zQE433MeDl8A4E2r4zqg=';
  }
  if (name.includes('casamento') || name.includes('festa')) {
    return 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  }
  if (name.includes('educação') || name.includes('curso') || name.includes('faculdade')) {
    return 'https://images.unsplash.com/photo-1527891751199-7225231a68dd?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  }
  if (name.includes('eletrônico') || name.includes('celular') || name.includes('computador')) {
    return 'https://images.unsplash.com/photo-1550514153-36f7460c17aa?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  }
  if (name.includes('saúde') || name.includes('academia') || name.includes('plano')) {
    return 'https://plus.unsplash.com/premium_photo-1661301057249-bd008eebd06a?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  }
  if (name.includes('investimento') || name.includes('aplicação')) {
    return 'https://images.unsplash.com/photo-1633158829875-e5316a358c6f?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  }
  
  // Imagem padrão para metas genéricas
  return 'https://media.istockphoto.com/id/1396991056/pt/foto/wooden-blocks-with-generic-text-of-concept-pens-notebooks-and-books.jpg?s=1024x1024&w=is&k=20&c=gjQrSIiS3YuzR95t1a6vKPNJ2zcpL_P2Tdt_8GSpaOk=';
};

export const getGoalType = (goalName: string): string => {
  const name = goalName.toLowerCase();
  
  if (name.includes('carro') || name.includes('veículo') || name.includes('automóvel')) {
    return 'Veículo';
  }
  if (name.includes('viagem') || name.includes('viajar') || name.includes('férias')) {
    return 'Viagem';
  }
  if (name.includes('casa') || name.includes('apartamento') || name.includes('imóvel')) {
    return 'Imóvel';
  }
  if (name.includes('emergência') || name.includes('reserva') || name.includes('contingência')) {
    return 'Reserva de Emergência';
  }
  if (name.includes('casamento') || name.includes('festa')) {
    return 'Evento';
  }
  if (name.includes('educação') || name.includes('curso') || name.includes('faculdade')) {
    return 'Educação';
  }
  if (name.includes('eletrônico') || name.includes('celular') || name.includes('computador')) {
    return 'Tecnologia';
  }
  if (name.includes('saúde') || name.includes('academia') || name.includes('plano')) {
    return 'Saúde';
  }
  if (name.includes('investimento') || name.includes('aplicação')) {
    return 'Investimento';
  }
  
  return 'Geral';
};
