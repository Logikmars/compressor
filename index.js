import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const supportedFormats = ['.png', '.jpg', '.jpeg'];

async function getAllFiles(dirPath) {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        return entry.isDirectory() ? await getAllFiles(fullPath) : fullPath;
    }));
    return files.flat();
}

async function convertImages() {
    try {
        const rootDir = process.cwd();
        const allFiles = await getAllFiles(rootDir);

        if (allFiles.length === 0) {
            console.log('ℹ️ В проекте нет файлов для конвертации.');
            return;
        }

        for (const file of allFiles) {
            const ext = path.extname(file).toLowerCase();
            const dirPath = path.dirname(file);
            const outputFileName = path.basename(file, ext) + '.webp';
            const outputFilePath = path.join(dirPath, outputFileName);

            if (supportedFormats.includes(ext)) {
                try {
                    const metadata = await sharp(file).metadata();

                    let sharpInstance = sharp(file);

                    if (metadata.width > 1920 || metadata.height > 1080) {
                        sharpInstance = sharpInstance.resize({
                            width: metadata.width > 1920 ? 1920 : undefined,
                            height: metadata.height > 1080 ? 1080 : undefined,
                            fit: 'inside',
                        });
                    }

                    await sharpInstance
                        .webp({ quality: 80 }) // Качество 80%
                        .toFile(outputFilePath);

                    // Удаляем исходный файл
                    await fs.promises.unlink(file);

                    console.log(`✅ ${file} успешно преобразован в ${outputFileName} и удалён.`);
                } catch (err) {
                    console.error(`❌ Ошибка преобразования ${file}:`, err);
                }
            } else {
                // console.log(`⏭️ Пропущен файл ${file} (неподдерживаемый формат: ${ext})`);
            }
        }

        console.log('🎉 Все подходящие изображения успешно обработаны и удалены!');
    } catch (err) {
        console.error('❌ Ошибка обработки файлов:', err);
    }
}

convertImages();
