import app from './app.js';

app.listen(app.get('port'), () => {
    console.log('Servidor funcionando en el puerto', app.get('port'));
});
