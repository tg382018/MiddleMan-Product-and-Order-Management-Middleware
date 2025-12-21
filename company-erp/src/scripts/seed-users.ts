import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getArgNumber, pickOne } from './seed-utils';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Repository } from 'typeorm';

const NAMES = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Charlie Davis', 'Eve Wilson', 'Frank Miller', 'Grace Hopper', 'Hank Pym', 'Ivy Queen'];
const CITIES = ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Kayseri'];
const COUNTRIES = ['Turkey'];

async function main() {
    const count = getArgNumber('count', 20);

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['log', 'warn', 'error'],
    });

    try {
        const userRepo = app.get<Repository<User>>('UserRepository');

        let created = 0;
        for (let i = 0; i < count; i++) {
            const name = pickOne(NAMES) + ' ' + (i + 1);
            const email = `user${i + 1}@example.com`;
            const city = pickOne(CITIES);

            const user = userRepo.create({
                name,
                email,
                address: {
                    fullName: name,
                    line1: `Street ${i + 1}, No ${i * 10 + 5}`,
                    city: city,
                    country: pickOne(COUNTRIES),
                    postalCode: `${34000 + i}`,
                    phone: `+90555${1000000 + i}`,
                },
            });

            await userRepo.save(user);
            created++;
            if (created % 5 === 0) console.log(`Created ${created}/${count} users...`);
        }

        console.log(`Done. Created ${created} users.`);
    } finally {
        await app.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
