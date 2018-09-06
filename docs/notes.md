Notes / notebook

Cloud? It will be flexible. User should be able to run it locally or on the cloud, therefore it should run in a container (Docker)

DB? Since the focus is on input, and it should be able to work with a variety of inventory management services, the backend API should make no assumptions about its storage medium.  I'm thinking some kind of lambda functions.  However,  out of the box it will store info in a no SQL database (mongoDB).

SQL? emphasis is on input, so a relationship database is not necessary. The information fields for each item may vary.

UI? camera, microphone, keyboard. multiple input modes supported. a11y emphasized from ground zero. ideally, user can change ui layout and inputs to suit their own entry style. 

tech? OCR, for book titles and descriptions, measurements,
camera for photos
speech to text for descriptions
image recognition for classification and description
keyboard for everything
themes for a11y
barcode and QR reader for tracking
