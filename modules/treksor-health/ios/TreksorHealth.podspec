Pod::Spec.new do |s|
  s.name = 'TreksorHealth'
  s.version = '1.0.0'
  s.summary = 'Read-only, permission-based workout import for Treksor'
  s.description = s.summary
  s.author = 'Treksor'
  s.homepage = 'https://treksor-community.oceanicman.chatgpt.site'
  s.license = { :type => 'Proprietary' }
  s.platforms = { :ios => '15.1' }
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'HealthKit'
  s.swift_version = '5.9'
  s.source_files = '**/*.{h,m,mm,swift}'
end
