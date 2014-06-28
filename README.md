community.franken.freifunk.net
==============================

Freifunk-Franken sieht sich als Meta-Communitie, bei der verschiedene Regionen, Städte und Dörfer eine gemeinsame Firmware und gemeinsame Gateways nutzen und untereinander vernetzt sind. Da wir uns Infrastruktur teilen sind auch viele der API-Felder bei allen Sub-Communities identisch. Dieses Repository dient dazu die einzelnen Communitie-Dateien für die Freifunk-API zu generieren.

Dabei wird wie folgt vorgegangen:

1. Jede Sub-Community erhält alle Eigentschaften (z.B. Kontaktdaten) aus einem gemeinsamen Meta-Community Objekt.
2. Jede Sub-Community hat ihre eigenen Koordinaten und ihren eigenen Namen. Auch andere Felder (z.B. Kontaktperson) kann in der Sub-Community überschriben werden.
3. Jede Sub-Community hat einen geografischen Mittelpunkt und einen Einzugs-Radius in km.
4. Das Skript halt alle Knoten aus dem Monitoring (Netmon) und schaut, welche Knoten im Einzugs-Bereich welcher Sub-Community liegen. Diese werden gezählt und jeder Sub-Community zugeordnet.

Setup
-----

```

```

Zuerst das Repository mit den eigentlichen Comunity-Files holen. (Dies ist nicht nötig, wenn man die Community-Dateien später auf einem eigenen Webserver ablegen will).

```
git clone https://github.com/FreifunkFranken/freifunkfranken-community.git
```

Dann dieses Repository holen, öffnen und Abhängigkeiten installieren.

```
git clone https://github.com/mojoaxel/community.franken.freifunk.net.git
cd community.franken.freifunk.net
npm install windston moment node-rest-client
```

Danach sollte die Datei [communitys_franken.json](https://github.com/FreifunkFranken/community.franken.freifunk.net/blob/master/communitys_franken.json) an die eigene Met-Communitity angepasst werden.


Ausführen
---------

Zuerst werden die eizelnen Sub-Communitie-Dateien erzeugt:
```
node create_community_files.js
```

Danach werden die Dateien auf Github gepushed. (Dies ist nicht nötig, wenn man die Community-Dateien später auf einem eigenen Webserver ablegen will).

```
cd ../freifunkfranken-community/
git commit -a -m "updated via netmon.freiunk-franken.de"
git push origin master
```
