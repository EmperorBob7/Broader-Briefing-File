# Usage
npm start

# Updating DigitalOcean Droplet
```
# Locally
npm run buildFront
npm run buildBack
cd ..
zip -r code.zip ./Broader-Briefing-File/
scp ./code.zip root@104.131.167.37:~

# Remotely
pm2 stop main-app
pm2 delete main-app
rm -rf ./Broader*
unzip ./code.zip
cd ./Broader-Briefing-File
pm2 start src/index.js --name main-app
```