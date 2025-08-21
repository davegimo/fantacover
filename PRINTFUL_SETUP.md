# Configurazione Printful per FantaCover

## Panoramica
Il negozio FantaCover è integrato con Printful per permettere agli utenti di personalizzare prodotti fisici con le loro rose di fantacalcio e procedere all'acquisto.

## Configurazione Printful

### 1. Creazione Account e Negozio
1. Vai su [Printful.com](https://www.printful.com)
2. Crea un account se non ne hai già uno
3. Accedi al tuo dashboard Printful
4. Crea un nuovo negozio se necessario

### 2. Configurazione API Key
1. Nel dashboard Printful, vai su **Settings** > **API**
2. Genera una nuova API key
3. Copia la chiave API
4. Crea un file `.env.local` nella root del progetto:
```bash
PRINTFUL_API_KEY=your_api_key_here
```

### 3. Preparazione Prodotti Template
Per il funzionamento ottimale, prepara almeno 3 prodotti template nel tuo negozio Printful:

#### Prodotti Consigliati:
1. **T-Shirt** - Prodotto base versatile
2. **Felpa/Hoodie** - Prodotto premium
3. **Poster/Stampa** - Opzione economica

#### Configurazione Prodotti:
1. Nel dashboard Printful, vai su **Store** > **Products**
2. Clicca **Add Product**
3. Scegli il tipo di prodotto (es. T-Shirt)
4. Configura le varianti (colori, taglie)
5. Imposta prezzi e disponibilità
6. **Importante**: Lascia vuoto il design - verrà applicato dinamicamente dall'app
7. Salva il prodotto

### 4. Configurazione Area di Stampa
Per ogni prodotto, assicurati che l'area di stampa sia configurata correttamente:
- **Posizione**: Front (fronte)
- **Dimensioni consigliate**: 
  - Larghezza: 1800px
  - Altezza: 1800px
  - Posizione top: 300px
  - Posizione left: 0px (centrato)

## API Endpoints Implementati

### `/api/printful/products`
- **GET**: Recupera tutti i prodotti del negozio
- Restituisce: Lista prodotti con varianti base

### `/api/printful/product/[id]`
- **GET**: Recupera dettagli specifici di un prodotto
- Restituisce: Dettagli completi prodotto con tutte le varianti

### `/api/printful/customize`
- **POST**: Applica un'immagine personalizzata a un prodotto
- Input: productId, variantId, imageBase64, positionOptions
- Restituisce: fileId e mockups di anteprima

## Flusso Utente

1. **Creazione Rosa**: L'utente crea la sua formazione nella pagina principale
2. **Navigazione Shop**: Accesso al negozio tramite il menu
3. **Selezione Prodotto**: Visualizzazione prodotti Printful disponibili
4. **Scelta Variante**: Selezione colore, taglia, ecc.
5. **Personalizzazione**: Applicazione automatica dell'immagine della rosa
6. **Anteprima**: Visualizzazione mockup del prodotto personalizzato
7. **Checkout**: Processo di acquisto (da implementare)

## Note Tecniche

### Gestione Immagini
- Le immagini delle rose vengono generate in formato 1080x1920px (Instagram Stories)
- Vengono convertite in base64 per l'upload a Printful
- Printful ridimensiona automaticamente per l'area di stampa

### Mockup Generation
- Printful genera automaticamente anteprime realistiche
- Il processo può richiedere alcuni secondi
- Fallback disponibile se la generazione fallisce

### Performance
- Le immagini delle rose vengono precaricate quando possibile
- Cache locale per ridurre chiamate API
- Gestione errori robusta per problemi di connettività

## Troubleshooting

### Errore "API Key non configurata"
- Verifica che il file `.env.local` esista
- Controlla che la variabile `PRINTFUL_API_KEY` sia impostata correttamente
- Riavvia il server di sviluppo dopo aver modificato le variabili d'ambiente

### Prodotti non visualizzati
- Verifica che i prodotti siano pubblicati nel dashboard Printful
- Controlla che i prodotti non siano marcati come "ignored"
- Assicurati che almeno una variante sia disponibile

### Errori di personalizzazione
- Verifica che l'immagine sia in formato valido (PNG/JPG)
- Controlla le dimensioni dell'immagine (max 10MB)
- Assicurati che il prodotto supporti la personalizzazione

## Prossimi Sviluppi

### Checkout Integration
- Implementazione ordini temporanei Printful
- Integrazione sistema di pagamento
- Gestione stati ordine e spedizione

### Ottimizzazioni
- Cache avanzata per prodotti e mockup
- Compressione immagini automatica
- Batch processing per ordini multipli

## Supporto
Per problemi con l'integrazione Printful:
1. Consulta la [documentazione ufficiale Printful API](https://developers.printful.com/)
2. Verifica lo stato dei servizi Printful
3. Controlla i log dell'applicazione per errori specifici

