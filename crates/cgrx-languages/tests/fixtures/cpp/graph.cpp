#include "juce_style.h"
#include <cmath>

namespace plugin::dsp {
namespace {
bool supportedRate(unsigned rate) { return rate == 48000; }
float clampUnit(float value) noexcept { return value; }
}

Processor::Processor() = default;
Processor::~Processor() = default;
void Processor::prepareToPlay(double sampleRate, int blockSize) {
    (void) sampleRate;
    (void) blockSize;
    supportedRate(48000); // A member context is deliberately unresolved.
}
void Processor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) {
    auto* samples = buffer.getWritePointer(0);
    data_[0] = clampUnit(samples[0]);
}
Processor::operator bool() const { return data_[0] > 0.0f; }
float& Processor::operator[](std::size_t index) { return data_[index]; }

bool checkRate() { return supportedRate(48000); }
float sanitize(float value) { return clampUnit(value); }
void unknownReceiver(Processor& engine) { engine.prepareToPlay(48000.0, 512); }

int overloaded(int value) { return value; }
double overloaded(double value) { return value; }
int ambiguous() { return overloaded(1); }
}
