#pragma once
#include <cstddef>

// Stand-ins keep this fixture self-contained while preserving JUCE type shapes.
namespace juce {
template <typename Sample> class AudioBuffer {
public:
    Sample* getWritePointer(int) { return nullptr; }
};
struct MidiBuffer {};
class AudioProcessor {
public:
    virtual ~AudioProcessor() = default;
    virtual void processBlock(AudioBuffer<float>&, MidiBuffer&) = 0;
};
}

namespace plugin::dsp {
struct Meter {
    Meter() noexcept : level(0.0f) {}
    ~Meter() noexcept {}
    Meter& operator=(const Meter&) = default;
    explicit operator bool() const noexcept { return level > 0.0f; }
    float operator()(float value) const { return value; }
    float level;
};

class Processor final : public juce::AudioProcessor {
public:
    Processor();
    ~Processor() override;
    void prepareToPlay(double sampleRate, int blockSize);
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;
    explicit operator bool() const;
    float& operator[](std::size_t);
    const float* samples() const noexcept { return data_; }
    struct Settings { double rate = 48000.0; };
private:
    float data_[2] = {};
};
}
