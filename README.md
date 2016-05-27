community.franken.freifunk.net
==============================

Freifunk-Franken sieht sich als Meta-Community, bei der verschiedene Regionen, Städte und Dörfer eine gemeinsame Firmware und gemeinsame Gateways nutzen und untereinander vernetzt sind.
Da wir uns Infrastruktur teilen sind auch viele der API-Felder bei allen Sub-Communities identisch.
Dieses Repository dient dazu die einzelnen Community-Dateien für die Freifunk-API zu generieren.

Dabei wird wie folgt vorgegangen:

1. Jede Sub-Community erhält alle Eigenschaften (z.B. Kontaktdaten) aus einem gemeinsamen Meta-Community Objekt.
2. Jede Sub-Community hat ihre eigenen Koordinaten und ihren eigenen Namen. Auch andere Felder (z.B. Kontaktperson) kann in der Sub-Community überschrieben werden.
3. Jede Sub-Community hat einen geografischen Mittelpunkt und einen Einzugs-Radius in km.
4. Das Skript holt alle Knoten aus dem Monitoring und schaut, welche Knoten im Einzugs-Bereich welcher Sub-Community liegen. Diese werden gezählt und der jeweiligen Sub-Community zugeordnet.

Setup
-----

Zuerst das Repository mit den eigentlichen Community-Files holen:

```
git clone git@github.com:FreifunkFranken/freifunkfranken-community.git
```

Dann dieses Repository holen:

```
git clone git@github.com:FreifunkFranken/community.franken.freifunk.net.git
```


Ausführen
---------

Nun werden die einzelnen Sub-Community-Dateien erzeugt bzw. aktualisiert:
```
cd community.franken.freifunk.net
python3 create_community_files.py ../freifunkfranken-community
```

Danach werden die Sub-Community-Dateien committed und zu GitHub gepushed:

```
cd ../freifunkfranken-community
git commit -a -m "Updated nodes count from Freifunk Franken Monitoring."
git push origin master
```
