Pod::Spec.new do |s|
  s.name = 'TreksorWake'
  s.version = '1.0.0'
  s.summary = 'Permission-based wake alarms for Treksor'
  s.description = s.summary
  s.author = 'Treksor'
  s.homepage = 'https://treksor-community.oceanicman.chatgpt.site'
  s.license = { :type => 'Proprietary' }
  s.platforms = { :ios => '15.1' }
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.swift_version = '5.9'
  s.source_files = '**/*.{h,m,mm,swift}'
end
