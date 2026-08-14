# Deployment pe VPS Ubuntu 24.04 LTS

Configurația rulează Next.js pe `127.0.0.1:3000`, Socket.IO pe
`127.0.0.1:3001` și Redis pe `127.0.0.1:6379`. Numai SSH, HTTP și HTTPS sunt
expuse public.

## Cerințe VPS recomandate

- Ubuntu Server 24.04 LTS;
- minimum 2 vCPU, 4 GB RAM și 40 GB SSD;
- adresă IPv4 publică;
- acces SSH cu cheie.

## Instalare inițială

Rulează comenzile ca utilizatorul inițial cu drepturi `sudo`:

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y nginx redis-server git ufw curl ca-certificates
sudo adduser --disabled-password --gecos "" travelcommunity
sudo mkdir -p /var/www/travel-community/{current,shared}
sudo chown -R travelcommunity:travelcommunity /var/www/travel-community

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Instalează Node.js 24 LTS dintr-o sursă oficială/menținută și verifică:

```bash
node --version
npm --version
```

## Redis

Editează `/etc/redis/redis.conf` conform
`deploy/redis/travel-community.conf`. Nu deschide portul 6379 în UFW.

```bash
sudo systemctl enable --now redis-server
redis-cli ping
ss -lnt | grep 6379
```

Rezultatul trebuie să fie `PONG`, iar Redis trebuie să asculte numai pe
loopback.

## Aplicație

```bash
sudo -u travelcommunity git clone <REPOSITORY_URL> /var/www/travel-community/current
sudo -u travelcommunity cp /var/www/travel-community/current/.env.production.example \
  /var/www/travel-community/shared/.env.production
sudo chmod 600 /var/www/travel-community/shared/.env.production
sudo chown travelcommunity:travelcommunity /var/www/travel-community/shared/.env.production
sudo -u travelcommunity ln -s /var/www/travel-community/shared/.env.production \
  /var/www/travel-community/current/.env.production
```

Completează pe server valorile reale din `.env.production`. Nu folosi cheile
Turnstile de test în producție.

```bash
cd /var/www/travel-community/current
sudo -u travelcommunity npm ci
sudo -u travelcommunity npm run lint
sudo -u travelcommunity npm run build
sudo -u travelcommunity node --env-file=/var/www/travel-community/shared/.env.production scripts/migrateExistingUsersEmailVerification.js
sudo -u travelcommunity node --env-file=/var/www/travel-community/shared/.env.production scripts/createProductionSecurityIndexes.js
sudo -u travelcommunity node --env-file=/var/www/travel-community/shared/.env.production scripts/createAdminIndexes.js
```

Symlinkul `.env.production` este ignorat de Git și permite Next.js să includă
configurația publică realtime/Turnstile în timpul buildului. Fișierul real
rămâne în directorul `shared`, cu permisiuni restrictive.

## systemd și Nginx

```bash
sudo cp deploy/systemd/*.service /etc/systemd/system/
sudo cp deploy/nginx/comunitatea-calatorilor.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/comunitatea-calatorilor.conf \
  /etc/nginx/sites-enabled/comunitatea-calatorilor.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now travel-community-web travel-community-realtime
sudo systemctl reload nginx
```

După ce DNS indică spre VPS, instalează Certbot și activează HTTPS. Nu activa
HSTS preload înainte să confirmi că toate subdomeniile funcționează exclusiv
prin HTTPS.

## Verificare și loguri

```bash
systemctl status travel-community-web travel-community-realtime redis-server
journalctl -u travel-community-web -u travel-community-realtime -f
curl --fail http://127.0.0.1:3000/
curl --fail http://127.0.0.1:3001/health
npm run test:smoke
```

## Actualizare și rollback

Înaintea fiecărui deployment păstrează commitul curent. Rulează `git pull`,
`npm ci`, auditul și buildul, apoi repornește ambele servicii. Pentru rollback,
revino la commitul anterior cunoscut ca stabil, rulează din nou `npm ci` și
`npm run build`, apoi repornește serviciile. Nu face rollback de schemă MongoDB
fără un plan separat și backup verificat.
