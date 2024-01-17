# Hi there!
This is simple Vending machine like Nextjs/THREE.js app.

# How to build
Manually with npm:
```bash
npm i
npm run build
npm start
```

Or with docker:
```bash
docker image build -t vending .
docker container run --name vending -d -p 3000:3000 vending
```

# Additional info
## Why do we need PreloadedDisplay component?
To split bundle and load heavy THREE.js lib separately 

## What are the interactive areas in on the model?
 - Keypad to select items
 - Glass to do CRUD operations
 - Hatch just for fun
 - Bottom area of the screen to get back to the front view

## Where do we load info?
It happens in _src/app/page.tsx_. There we call __requestDBData()__ function to get mock data. It is SSR way to do request.

## What is the general structure?
Generally speaking, we have graphic(THREE.js) part and React.js part. First one is written following MVC architecture and the second one is just common Next.js app. MVC was chosen because of it's simplicity.