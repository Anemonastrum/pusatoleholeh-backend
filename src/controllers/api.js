import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const apiStatus = (req, res) => {
    const filePath = path.join(__dirname, '../../');
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(500).send('An error occurred while loading the page.');
        }
    });
};

export const getServerStatus = async (req, res) => {
    try {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const cpuUsage = os.loadavg();
        const uptime = os.uptime();

        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

        const processUptime = process.uptime();
        const nodeVersion = process.version;
        
        const status = {
            system: {
                platform: os.platform(),
                type: os.type(),
                release: os.release(),
                architecture: os.arch(),
                cpus: os.cpus().length,
                memory: {
                    total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    usagePercentage: `${((usedMemory / totalMemory) * 100).toFixed(2)}%`
                },
                loadAverage: {
                    '1min': cpuUsage[0].toFixed(2),
                    '5min': cpuUsage[1].toFixed(2),
                    '15min': cpuUsage[2].toFixed(2)
                },
                uptime: `${(uptime / 3600).toFixed(2)} hours`
            },
            process: {
                nodeVersion,
                uptime: `${processUptime.toFixed(2)} seconds`,
                memoryUsage: process.memoryUsage(),
                pid: process.pid
            },
            database: {
                status: dbStatus,
                name: mongoose.connection.name,
                host: mongoose.connection.host
            },
            timestamp: new Date().toISOString()
        };

        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching server status', 
            error: error.message 
        });
    }
};