# conversorcrypto

Para executar siga os passos:
  •Execute o Terminal o local do app e digite o código:
      npm install
  
  •Inicialize um serviço MySQL;
  
  •Crie um banco de dados no MySQL;
  
  •Se suas env's estiverem configuradas, pode configurar
  na raiz o arquivo ".env" com as informações de acesso ao
  banco de dados e jwttoken, se não, utilizará as configuradas
  nos dois arquivos próximos;
  
    ○ Caso necessário alterare o nome e senha do banco de dados e jwttoken nos locais:
      ./config/db.js
      ./.env
    ○ Configure também em:
      ./controllers/authController.js
  
  •Execute no terminal local :
     node server.js
     
 •Basta abrir o index.html localizado em ./src/index.html
