package com.fastcast.processing.service;

import com.fastcast.config.properties.FFmpegProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FFmpegService {

    private final FFmpegProperties ffmpegProperties;

    // Quality levels for HLS
    private static final int[][] QUALITIES = {
            // {width, height, videoBitrate(kbps), audioBitrate(kbps)}
            {1280, 720,  2800, 128},
            {854,  480,  1400, 128},
            {426,  240,  400,  64}
    };

    private static final String[] QUALITY_NAMES = {"720p", "480p", "240p"};

    public Path convertToHls(Path inputFile, UUID videoId) throws IOException, InterruptedException {
        // Create output directory
        Path outputDir = Paths.get(ffmpegProperties.getOutputDir(), videoId.toString());
        Files.createDirectories(outputDir);

        log.info("Starting HLS conversion for videoId: {}", videoId);
        log.info("Input: {}", inputFile);
        log.info("Output dir: {}", outputDir);

        // Build FFmpeg command for multi-quality HLS
        List<String> command = buildFFmpegCommand(inputFile, outputDir);

        log.debug("FFmpeg command: {}", String.join(" ", command));

        // Execute FFmpeg
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();

        // Log FFmpeg output
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                log.debug("FFmpeg: {}", line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("FFmpeg failed with exit code: " + exitCode);
        }

        log.info("HLS conversion complete for videoId: {}", videoId);
        return outputDir;
    }

    private List<String> buildFFmpegCommand(Path inputFile, Path outputDir) {
        List<String> cmd = new ArrayList<>();
        cmd.add(ffmpegProperties.getPath());
        cmd.add("-i");
        cmd.add(inputFile.toString());

        // Map input to multiple outputs
        for (int i = 0; i < QUALITIES.length; i++) {
            cmd.add("-map"); cmd.add("0:v:0");
            cmd.add("-map"); cmd.add("0:a:0");
        }

        // Encoding settings per quality
        for (int i = 0; i < QUALITIES.length; i++) {
            int[] q = QUALITIES[i];
            cmd.add("-s:v:" + i);       cmd.add(q[0] + "x" + q[1]);
            cmd.add("-c:v:" + i);       cmd.add("libx264");
            cmd.add("-b:v:" + i);       cmd.add(q[2] + "k");
            cmd.add("-c:a:" + i);       cmd.add("aac");
            cmd.add("-b:a:" + i);       cmd.add(q[3] + "k");
        }

        // HLS settings
        cmd.add("-f");              cmd.add("hls");
        cmd.add("-hls_time");       cmd.add("6");
        cmd.add("-hls_playlist_type"); cmd.add("vod");
        cmd.add("-hls_segment_filename");
        cmd.add(outputDir.resolve("stream_%v/segment%03d.ts").toString());
        cmd.add("-master_pl_name"); cmd.add("master.m3u8");
        cmd.add("-var_stream_map");
        cmd.add("v:0,a:0,name:720p v:1,a:1,name:480p v:2,a:2,name:240p");

        cmd.add(outputDir.resolve("stream_%v/index.m3u8").toString());

        return cmd;
    }

    public long getVideoDuration(Path videoFile) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    ffmpegProperties.getFfprobePath(),
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    videoFile.toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String output = reader.readLine();
                if (output != null) {
                    return (long) Double.parseDouble(output.trim());
                }
            }
            process.waitFor();
        } catch (Exception e) {
            log.error("Failed to get video duration", e);
        }
        return 0L;
    }
}