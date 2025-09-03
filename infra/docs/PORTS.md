# BookBook — Ports Reference

Quick map of what runs where on the Pi.

---

## Reserved / In Use

| Port  | Service                | Notes                          |
|-------|------------------------|--------------------------------|
| 22    | SSH                    | Remote shell access            |
| 53    | dnsmasq                | Local DNS (don’t touch)        |
| 67/68 | dnsmasq, dhcpcd        | DHCP (don’t touch)             |
| 80    | Nginx Proxy Manager    | Public HTTP entry point        |
| 81    | NPM Admin UI           | Reverse proxy UI               |
| 443   | Nginx Proxy Manager    | Public HTTPS entry point       |
| 139   | smbd                   | Samba (legacy)                 |
| 445   | smbd                   | Samba (legacy)                 |
| 5900  | wayvnc                 | VNC remote desktop             |
| 631   | CUPS                   | Printing service               |
| 3306  | MariaDB                | Local only (Moodle tests)      |
| 6969  | BookBook Main backend  | systemd service, .env.production |
| 6970  | BookBook Demo backend  | systemd service, .env.demo     |
| 9443  | Portainer (Docker UI)  | Optional                       |
| 27017 | Mongo Main             | Loopback only                  |
| 27018 | Mongo Demo             | Loopback only                  |

---

## Notes

- **Publicly exposed:** only 80/443 (HTTP/HTTPS) and 81 (NPM admin, ideally firewalled).  
- **Internal only:** BookBook apps, Mongo, MariaDB, Samba, etc.  
- **Policy:** do not reassign 6969/6970 — these are reserved for BookBook.  