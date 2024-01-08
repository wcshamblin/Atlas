# [Atlas](https://atlas2.org/)

A map designed for exploration and photography, driven by React and FastAPI.

For FCC database initialization please see [fcc-seed-data](https://github.com/joshua-dweber/fcc-seed-data)

Entry points are api -> start.sh and website -> package.json


### Starting the website locally
Windows:
`py -3 api/start.sh`

Linux:
`python3 api/start.sh`

After the API is started:

```
# pwd /website
npm run build
npm run start
```

If you would like to, you can avoid dealing with the Python API entirely by editing the .env to point the React site to https://atlas2.org/api/