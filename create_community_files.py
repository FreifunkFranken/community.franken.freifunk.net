#!/usr/bin/python3

# Copyright 2016, Steffen Pankratz.
# SPDX-License-Identifier: AGPL-3
# For license see LICENSE or http://spdx.org/licenses/AGPL-3.0

from math import sin, cos, sqrt, asin, radians

import datetime
import json
import os
import urllib.request
import sys


def get_json_data_from_url(url):
    return json.loads(urllib.request.urlopen(url).read().decode())


def get_json_data_from_file(file):
    with open(file, 'r') as json_file:
        return json.load(json_file)


def get_distance_in_km(point_x, point_y):
    lat_x = point_x['lat']
    lon_x = point_x['lon']
    lat_y = point_y['lat']
    lon_y = point_y['lon']
    dlon = lon_y - lon_x
    dlat = lat_y - lat_x
    a = sin(dlat / 2) ** 2 + cos(lat_x) * cos(lat_y) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    radius = 6373.0  # approximate radius of earth in km
    return radius * c


def merge(a, b, path=None):
    if path is None:
        path = []
    for key in b:
        if key in a:
            if isinstance(a[key], dict) and isinstance(b[key], dict):
                merge(a[key], b[key], path + [str(key)])
            elif isinstance(a[key], list) and isinstance(b[key], list):
                a[key].extend(b[key])
            elif a[key] == b[key]:
                pass  # same value
            else:
                pass  # keep value from a
        else:
            a[key] = b[key]
    return a


def get_router_count_by_community(routers, community):
    router_count_by_community = 0
    point_y = dict()
    point_y['lat'] = radians(float(community['data']['location']['lat']))
    point_y['lon'] = radians(float(community['data']['location']['lon']))
    for router in routers:
        if get_distance_in_km(router, point_y) < community['radius']:
            router_count_by_community += 1
    return router_count_by_community


def get_online_routers(nodelist_data):
    routers = []
    for router in nodelist_data['nodes']:
        if router['status']['online'] and 'position' in router:
            routers.append(
                {'lat': radians(router['position']['lat']),
                 'lon': radians(router['position']['long'])})
    return routers


def update_community_files(nodelist_url, communities_file, output_dir):
    nodelist_data = get_json_data_from_url(nodelist_url)
    routers = get_online_routers(nodelist_data)
    community_data = get_json_data_from_file(communities_file)
    for community in community_data['communities']:
        merge(community, community_data['metacommunity'])
        community['data']['state']['nodes'] = get_router_count_by_community(
            routers, community)
        community['data']['state']['lastchange'] = datetime.datetime.utcnow() \
                                                           .isoformat() + 'Z'
        with open(os.path.join(output_dir,
                               community['id'] + '.json'), 'w') as json_file:
            json.dump(community['data'], json_file, indent=4, sort_keys=True,
                      ensure_ascii=False)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        exit('Please specify a directory for the community files.')
    output_directory = sys.argv[1]
    if not os.path.exists(output_directory):
        os.mkdir(output_directory)
    update_community_files(
        'https://monitoring.freifunk-franken.de/api/nodelist',
        'communitys_franken.json', output_directory)
